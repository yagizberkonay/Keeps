from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'keeps_jwt_secret_default')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Pydantic Models ───

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    company: str = ""

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    company: str = ""
    created_at: str

class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0
    amount: float = 0

class InvoiceCreate(BaseModel):
    client_name: str
    client_email: str = ""
    client_address: str = ""
    client_phone: str = ""
    items: List[InvoiceItem] = []
    currency: str = "USD"
    tax_rate: float = 0
    due_date: str = ""
    notes: str = ""
    payment_terms: str = "Net 30"
    from_name: str = ""
    from_address: str = ""

class InvoiceOut(BaseModel):
    id: str
    user_id: str
    invoice_number: str
    client_name: str
    client_email: str
    items: List[InvoiceItem]
    currency: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    status: str
    due_date: str
    notes: str
    created_at: str

class ProjectCreate(BaseModel):
    name: str
    client_name: str
    budget: float = 0
    description: str = ""

class MilestoneCreate(BaseModel):
    name: str
    amount: float = 0
    due_date: str = ""

class ClientCreate(BaseModel):
    name: str
    email: str = ""
    company: str = ""
    phone: str = ""
    address: str = ""
    website: str = ""
    notes: str = ""

class ProfileUpdate(BaseModel):
    name: str = ""
    company: str = ""

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class TaxCalcRequest(BaseModel):
    revenue: float
    expenses: float = 0
    tax_type: str = "vat"
    rate: Optional[float] = None

class VaultAction(BaseModel):
    amount: float
    action: str = "deposit"
    note: str = ""

class ChatRequest(BaseModel):
    message: str
    session_id: str = ""

# ─── Auth Helpers ───

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def create_session_token():
    return f"sess_{uuid.uuid4().hex}"

# ─── Auth Routes ───

@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hashed,
        "picture": "",
        "company": data.company,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    session_token = create_session_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    })
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*3600
    )
    return {"user_id": user_id, "email": data.email, "name": data.name, "company": data.company, "session_token": session_token}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(data.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session_token = create_session_token()
    now = datetime.now(timezone.utc).isoformat()
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": now
    })
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*3600
    )
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "company": user.get("company", ""), "session_token": session_token}

@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture", ""),
        "company": user.get("company", "")
    }

@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    google_data = resp.json()
    email = google_data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": google_data.get("name", existing.get("name", "")), "picture": google_data.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": google_data.get("name", ""),
            "picture": google_data.get("picture", ""),
            "company": "",
            "created_at": now
        })
    session_token = create_session_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*3600
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", ""), "session_token": session_token}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ─── Dashboard ───

@api_router.get("/dashboard/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    invoices = await db.invoices.find({"user_id": uid}, {"_id": 0}).to_list(1000)
    projects = await db.projects.find({"user_id": uid}, {"_id": 0}).to_list(1000)
    total_revenue = sum(i.get("total", 0) for i in invoices if i.get("status") == "paid")
    total_pending = sum(i.get("total", 0) for i in invoices if i.get("status") in ["sent", "draft"])
    total_tax = sum(i.get("tax_amount", 0) for i in invoices if i.get("status") == "paid")
    vault = await db.tax_vault.find_one({"user_id": uid}, {"_id": 0})
    vault_amount = vault.get("current_amount", 0) if vault else 0
    vault_target = vault.get("target_amount", 0) if vault else 0
    active_projects = len([p for p in projects if p.get("status") == "active"])
    return {
        "total_revenue": total_revenue,
        "total_pending": total_pending,
        "total_tax": total_tax,
        "vault_amount": vault_amount,
        "vault_target": vault_target,
        "total_invoices": len(invoices),
        "active_projects": active_projects,
        "recent_invoices": sorted(invoices, key=lambda x: x.get("created_at", ""), reverse=True)[:5],
        "monthly_data": _calc_monthly_data(invoices)
    }

def _calc_monthly_data(invoices):
    months = {}
    for inv in invoices:
        if inv.get("status") == "paid":
            created = inv.get("created_at", "")[:7]
            if created:
                if created not in months:
                    months[created] = {"month": created, "revenue": 0, "tax": 0}
                months[created]["revenue"] += inv.get("total", 0)
                months[created]["tax"] += inv.get("tax_amount", 0)
    return sorted(months.values(), key=lambda x: x["month"])[-6:]

# ─── Invoices ───

@api_router.get("/invoices")
async def list_invoices(user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    return invoices

@api_router.post("/invoices")
async def create_invoice(data: InvoiceCreate, user: dict = Depends(get_current_user)):
    count = await db.invoices.count_documents({"user_id": user["user_id"]})
    inv_number = f"INV-{count + 1:04d}"
    items = []
    subtotal = 0
    for item in data.items:
        amt = item.quantity * item.unit_price
        items.append({"description": item.description, "quantity": item.quantity, "unit_price": item.unit_price, "amount": amt})
        subtotal += amt
    tax_amount = subtotal * (data.tax_rate / 100)
    total = subtotal + tax_amount
    inv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": inv_id,
        "user_id": user["user_id"],
        "invoice_number": inv_number,
        "client_name": data.client_name,
        "client_email": data.client_email,
        "client_address": data.client_address,
        "client_phone": data.client_phone,
        "items": items,
        "currency": data.currency,
        "subtotal": subtotal,
        "tax_rate": data.tax_rate,
        "tax_amount": tax_amount,
        "total": total,
        "status": "draft",
        "due_date": data.due_date or (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"),
        "notes": data.notes,
        "payment_terms": data.payment_terms,
        "from_name": data.from_name or user.get("name", ""),
        "from_address": data.from_address,
        "created_at": now
    }
    await db.invoices.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    body.pop("_id", None)
    body.pop("id", None)
    body.pop("user_id", None)
    result = await db.invoices.update_one(
        {"id": invoice_id, "user_id": user["user_id"]},
        {"$set": body}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    updated = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return updated

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    result = await db.invoices.delete_one({"id": invoice_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Deleted"}

# ─── Tax Calculations ───

@api_router.post("/tax/calculate")
async def calculate_tax(data: TaxCalcRequest, user: dict = Depends(get_current_user)):
    net_income = data.revenue - data.expenses
    if data.tax_type == "vat":
        rate = data.rate if data.rate is not None else 20
        tax = data.revenue * (rate / 100)
        return {"tax_type": "VAT (KDV)", "rate": rate, "base": data.revenue, "tax_amount": round(tax, 2), "net_after_tax": round(data.revenue - tax, 2)}
    elif data.tax_type == "withholding":
        rate = data.rate if data.rate is not None else 20
        tax = data.revenue * (rate / 100)
        return {"tax_type": "Withholding Tax (Stopaj)", "rate": rate, "base": data.revenue, "tax_amount": round(tax, 2), "net_after_tax": round(data.revenue - tax, 2)}
    elif data.tax_type == "income":
        brackets = [
            (110000, 15), (230000, 20), (580000, 27),
            (3000000, 35), (float('inf'), 40)
        ]
        tax = 0
        remaining = net_income
        prev = 0
        details = []
        for limit, rate_pct in brackets:
            taxable = min(remaining, limit - prev)
            if taxable <= 0:
                break
            bracket_tax = taxable * (rate_pct / 100)
            tax += bracket_tax
            details.append({"bracket": f"{prev:,.0f} - {limit:,.0f}", "rate": rate_pct, "taxable": round(taxable, 2), "tax": round(bracket_tax, 2)})
            remaining -= taxable
            prev = limit
        return {"tax_type": "Income Tax", "net_income": round(net_income, 2), "total_tax": round(tax, 2), "effective_rate": round((tax / net_income * 100) if net_income > 0 else 0, 2), "brackets": details}
    raise HTTPException(status_code=400, detail="Unknown tax type")

@api_router.get("/tax/summary")
async def tax_summary(user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({"user_id": user["user_id"], "status": "paid"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(i.get("total", 0) for i in invoices)
    total_tax_collected = sum(i.get("tax_amount", 0) for i in invoices)
    return {"total_revenue": round(total_revenue, 2), "total_tax_collected": round(total_tax_collected, 2), "invoice_count": len(invoices)}

# ─── Tax Vault ───

@api_router.get("/tax/vault")
async def get_vault(user: dict = Depends(get_current_user)):
    vault = await db.tax_vault.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not vault:
        vault = {"user_id": user["user_id"], "target_amount": 0, "current_amount": 0, "transactions": []}
    return vault

@api_router.post("/tax/vault")
async def vault_action(data: VaultAction, user: dict = Depends(get_current_user)):
    vault = await db.tax_vault.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not vault:
        vault = {"user_id": user["user_id"], "target_amount": 0, "current_amount": 0, "transactions": []}
        await db.tax_vault.insert_one({**vault})
    current = vault.get("current_amount", 0)
    if data.action == "deposit":
        new_amount = current + data.amount
    elif data.action == "withdraw":
        new_amount = max(0, current - data.amount)
    elif data.action == "set_target":
        await db.tax_vault.update_one({"user_id": user["user_id"]}, {"$set": {"target_amount": data.amount}})
        updated = await db.tax_vault.find_one({"user_id": user["user_id"]}, {"_id": 0})
        return updated
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    tx = {"id": str(uuid.uuid4()), "action": data.action, "amount": data.amount, "note": data.note, "date": datetime.now(timezone.utc).isoformat()}
    await db.tax_vault.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"current_amount": new_amount}, "$push": {"transactions": tx}}
    )
    updated = await db.tax_vault.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ─── Projects ───

@api_router.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    return await db.projects.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)

@api_router.post("/projects")
async def create_project(data: ProjectCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "name": data.name,
        "client_name": data.client_name,
        "budget": data.budget,
        "spent": 0,
        "description": data.description,
        "status": "active",
        "milestones": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    body.pop("_id", None)
    body.pop("id", None)
    body.pop("user_id", None)
    result = await db.projects.update_one({"id": project_id, "user_id": user["user_id"]}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return updated

@api_router.post("/projects/{project_id}/milestones")
async def add_milestone(project_id: str, data: MilestoneCreate, user: dict = Depends(get_current_user)):
    milestone = {"id": str(uuid.uuid4()), "name": data.name, "amount": data.amount, "due_date": data.due_date, "status": "pending"}
    result = await db.projects.update_one(
        {"id": project_id, "user_id": user["user_id"]},
        {"$push": {"milestones": milestone}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return milestone

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Deleted"}

# ─── Clients ───

@api_router.get("/clients")
async def list_clients(user: dict = Depends(get_current_user)):
    return await db.clients.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)

@api_router.post("/clients")
async def create_client(data: ClientCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "name": data.name,
        "email": data.email,
        "company": data.company,
        "phone": data.phone,
        "address": data.address,
        "website": data.website,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clients.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ─── Client Delete ───

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Deleted"}

# ─── FX Rates ───

@api_router.get("/fx/rates")
async def get_fx_rates(base: str = "USD"):
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(f"https://open.er-api.com/v6/latest/{base}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return {"base": base, "rates": data.get("rates", {}), "updated": data.get("time_last_update_utc", "")}
    except Exception as e:
        logger.error(f"FX API error: {e}")
    return {"base": base, "rates": {"USD": 1, "EUR": 0.92, "GBP": 0.79, "TRY": 34.5, "JPY": 154.2}, "updated": "fallback"}

# ─── AI Advisor ───

@api_router.post("/ai/chat")
async def ai_chat(data: ChatRequest, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    session_id = data.session_id or f"ai_{user['user_id']}"
    system_msg = (
        "You are Keeps AI, a friendly and knowledgeable tax and finance advisor for freelancers and creative agencies. "
        "You specialize in: expense categorization, tax deduction optimization, VAT/withholding tax advice, "
        "invoice best practices, and financial planning. Keep responses concise, practical, and actionable. "
        "Format important numbers and percentages clearly. Use bullet points for lists."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_msg
    ).with_model("gemini", "gemini-3-flash-preview")
    user_message = UserMessage(text=data.message)
    try:
        response = await chat.send_message(user_message)
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")
    now = datetime.now(timezone.utc).isoformat()
    await db.ai_chats.insert_one({
        "user_id": user["user_id"],
        "session_id": session_id,
        "user_message": data.message,
        "ai_response": response,
        "created_at": now
    })
    return {"response": response, "session_id": session_id}

@api_router.get("/ai/history")
async def ai_history(user: dict = Depends(get_current_user)):
    chats = await db.ai_chats.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return chats

# ─── Invoice PDF ───

@api_router.get("/invoices/{invoice_id}/pdf")
async def get_invoice_pdf(invoice_id: str, user: dict = Depends(get_current_user)):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER
    from starlette.responses import StreamingResponse

    inv = await db.invoices.find_one({"id": invoice_id, "user_id": user["user_id"]}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=25*mm, rightMargin=25*mm, topMargin=20*mm, bottomMargin=20*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('InvTitle', parent=styles['Heading1'], fontSize=28, textColor=colors.HexColor('#1a1a1a'), spaceAfter=4, fontName='Helvetica-Bold')
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor('#999999'), fontName='Helvetica-Bold', spaceAfter=2)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#333333'), fontName='Helvetica')
    small_style = ParagraphStyle('Small', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#888888'), fontName='Helvetica')
    center_style = ParagraphStyle('Center', parent=small_style, alignment=TA_CENTER)

    elements = []

    # Header
    header_data = [
        [Paragraph('INVOICE', title_style), Paragraph('<b>Keeps</b><br/><font size="7" color="#999">Hermes Software Inc.</font>', ParagraphStyle('Brand', parent=value_style, alignment=TA_RIGHT))],
    ]
    header_table = Table(header_data, colWidths=[doc.width*0.6, doc.width*0.4])
    header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('TOPPADDING', (0,0), (-1,-1), 0), ('BOTTOMPADDING', (0,0), (-1,-1), 0)]))
    elements.append(header_table)
    elements.append(Spacer(1, 3*mm))

    # Invoice info row
    info_data = [[
        Paragraph(f'<font size="7" color="#999">INVOICE NUMBER</font><br/><font size="10" color="#333">{inv.get("invoice_number", "")}</font>', value_style),
        Paragraph(f'<font size="7" color="#999">DATE</font><br/><font size="10" color="#333">{inv.get("created_at", "")[:10]}</font>', value_style),
        Paragraph(f'<font size="7" color="#999">DUE DATE</font><br/><font size="10" color="#333">{inv.get("due_date", "")}</font>', value_style),
        Paragraph(f'<font size="7" color="#999">STATUS</font><br/><font size="10" color="#333">{inv.get("status", "draft").upper()}</font>', value_style),
    ]]
    info_table = Table(info_data, colWidths=[doc.width*0.25]*4)
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEABOVE', (0,0), (-1,0), 0.5, colors.HexColor('#e0e0e0')),
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#e0e0e0')),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 6*mm))

    # Bill To
    elements.append(Paragraph('BILL TO', label_style))
    elements.append(Paragraph(f'<b>{inv.get("client_name", "")}</b>', value_style))
    if inv.get("client_email"): elements.append(Paragraph(inv["client_email"], small_style))
    if inv.get("client_address"): elements.append(Paragraph(inv["client_address"], small_style))
    if inv.get("client_phone"): elements.append(Paragraph(inv["client_phone"], small_style))
    elements.append(Spacer(1, 8*mm))

    # Items table
    cur = inv.get("currency", "USD")
    item_header = ['Description', 'Qty', 'Unit Price', 'Amount']
    item_data = [item_header]
    for it in inv.get("items", []):
        item_data.append([
            it.get("description", ""),
            str(it.get("quantity", 0)),
            f'{cur} {it.get("unit_price", 0):,.2f}',
            f'{cur} {it.get("amount", 0):,.2f}',
        ])

    items_table = Table(item_data, colWidths=[doc.width*0.45, doc.width*0.12, doc.width*0.22, doc.width*0.21])
    items_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 7),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#999999')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#333333')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#e0e0e0')),
        ('LINEBELOW', (0,1), (-1,-2), 0.25, colors.HexColor('#f0f0f0')),
        ('LINEBELOW', (0,-1), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4*mm))

    # Totals
    totals_data = [
        ['', '', 'Subtotal', f'{cur} {inv.get("subtotal", 0):,.2f}'],
        ['', '', f'Tax ({inv.get("tax_rate", 0)}%)', f'{cur} {inv.get("tax_amount", 0):,.2f}'],
    ]
    totals_table = Table(totals_data, colWidths=[doc.width*0.45, doc.width*0.12, doc.width*0.22, doc.width*0.21])
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#888888')),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(totals_table)

    # Total line
    total_data = [['', '', 'TOTAL', f'{cur} {inv.get("total", 0):,.2f}']]
    total_table = Table(total_data, colWidths=[doc.width*0.45, doc.width*0.12, doc.width*0.22, doc.width*0.21])
    total_table.setStyle(TableStyle([
        ('FONTNAME', (2,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (2,0), (2,0), 9),
        ('FONTSIZE', (3,0), (3,0), 13),
        ('TEXTCOLOR', (2,0), (-1,0), colors.HexColor('#1a1a1a')),
        ('ALIGN', (2,0), (-1,0), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('LINEABOVE', (2,0), (-1,0), 1.5, colors.HexColor('#1a1a1a')),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 10*mm))

    # Notes
    if inv.get("notes"):
        elements.append(Paragraph('NOTES', label_style))
        elements.append(Paragraph(inv["notes"], small_style))
        elements.append(Spacer(1, 4*mm))

    if inv.get("payment_terms"):
        elements.append(Paragraph(f'Payment Terms: {inv["payment_terms"]}', small_style))
        elements.append(Spacer(1, 8*mm))

    # Footer
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph('Thank you for your business', center_style))
    elements.append(Paragraph('Powered by Keeps \u00b7 Hermes Software Inc.', ParagraphStyle('Footer', parent=center_style, fontSize=7, textColor=colors.HexColor('#cccccc'))))

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{inv.get("invoice_number", "invoice")}.pdf"'})

# ─── Settings ───

@api_router.put("/settings/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    update = {}
    if data.name: update["name"] = data.name
    if data.company is not None: update["company"] = data.company
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user_id": updated["user_id"], "email": updated["email"], "name": updated["name"], "company": updated.get("company", "")}

@api_router.put("/settings/password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="Password change not available for social login accounts")
    if not bcrypt.checkpw(data.current_password.encode(), user_doc["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    new_hash = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"password_hash": new_hash}})
    return {"message": "Password changed successfully"}

@api_router.get("/settings/export")
async def export_data(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    invoices = await db.invoices.find({"user_id": uid}, {"_id": 0}).to_list(10000)
    projects = await db.projects.find({"user_id": uid}, {"_id": 0}).to_list(10000)
    clients = await db.clients.find({"user_id": uid}, {"_id": 0}).to_list(10000)
    vault = await db.tax_vault.find_one({"user_id": uid}, {"_id": 0})
    chats = await db.ai_chats.find({"user_id": uid}, {"_id": 0}).to_list(10000)
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {"user_id": uid, "email": user["email"], "name": user["name"], "company": user.get("company", "")},
        "invoices": invoices,
        "projects": projects,
        "clients": clients,
        "tax_vault": vault,
        "ai_chats": chats
    }

@api_router.delete("/settings/data")
async def delete_all_data(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    await db.invoices.delete_many({"user_id": uid})
    await db.projects.delete_many({"user_id": uid})
    await db.clients.delete_many({"user_id": uid})
    await db.tax_vault.delete_many({"user_id": uid})
    await db.ai_chats.delete_many({"user_id": uid})
    return {"message": "All data deleted"}

@api_router.delete("/settings/account")
async def delete_account(request: Request, response: Response, user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    await db.invoices.delete_many({"user_id": uid})
    await db.projects.delete_many({"user_id": uid})
    await db.clients.delete_many({"user_id": uid})
    await db.tax_vault.delete_many({"user_id": uid})
    await db.ai_chats.delete_many({"user_id": uid})
    await db.user_sessions.delete_many({"user_id": uid})
    await db.users.delete_one({"user_id": uid})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Account deleted"}

# ─── Root ───

@api_router.get("/")
async def root():
    return {"message": "Keeps API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

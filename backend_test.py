#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Keeps Financial Dashboard
Tests all endpoints with proper authentication and error handling
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class KeepsAPITester:
    def __init__(self, base_url: str = "https://nomad-taxes.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials from /app/memory/test_credentials.md
        self.test_email = "test@keeps.app"
        self.test_password = "Test123!"
        self.provided_token = "sess_e6b00d410a094061bdb284086a3ead35"

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    use_auth: bool = True, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n🔐 Testing Authentication Flow...")
        
        # Test 1: Login with test credentials
        login_data = {"email": self.test_email, "password": self.test_password}
        success, response = self.make_request("POST", "/auth/login", login_data, use_auth=False)
        
        if success and "session_token" in response:
            self.session_token = response["session_token"]
            self.user_data = response
            self.log_test("Auth Login", True, f"Token: {self.session_token[:20]}...")
        else:
            self.log_test("Auth Login", False, f"Response: {response}")
            # Try with provided token as fallback
            self.session_token = self.provided_token
            print(f"⚠️  Using provided token as fallback: {self.provided_token}")
        
        # Test 2: Check /auth/me endpoint
        success, response = self.make_request("GET", "/auth/me")
        if success:
            self.user_data = response
            self.log_test("Auth Me Endpoint", True, f"User: {response.get('email', 'N/A')}")
        else:
            self.log_test("Auth Me Endpoint", False, f"Response: {response}")
        
        # Test 3: Test logout
        success, response = self.make_request("POST", "/auth/logout")
        self.log_test("Auth Logout", success, "" if success else f"Response: {response}")
        
        # Re-login for subsequent tests
        if not self.session_token or self.session_token == self.provided_token:
            success, response = self.make_request("POST", "/auth/login", login_data, use_auth=False)
            if success and "session_token" in response:
                self.session_token = response["session_token"]

    def test_dashboard(self):
        """Test dashboard summary endpoint"""
        print("\n📊 Testing Dashboard...")
        
        success, response = self.make_request("GET", "/dashboard/summary")
        if success:
            required_fields = ["total_revenue", "total_pending", "total_tax", "vault_amount", 
                             "total_invoices", "active_projects", "recent_invoices", "monthly_data"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Dashboard Summary", True, f"Revenue: ${response.get('total_revenue', 0)}")
            else:
                self.log_test("Dashboard Summary", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Dashboard Summary", False, f"Response: {response}")

    def test_invoices(self):
        """Test invoice CRUD operations"""
        print("\n📄 Testing Invoices...")
        
        # Test 1: List invoices
        success, invoices = self.make_request("GET", "/invoices")
        self.log_test("List Invoices", success, f"Count: {len(invoices) if success else 'N/A'}")
        
        # Test 2: Create invoice
        invoice_data = {
            "client_name": "Test Client",
            "client_email": "client@test.com",
            "items": [
                {"description": "Test Service", "quantity": 2, "unit_price": 100}
            ],
            "currency": "USD",
            "tax_rate": 20,
            "notes": "Test invoice"
        }
        
        success, new_invoice = self.make_request("POST", "/invoices", invoice_data, expected_status=200)
        invoice_id = None
        if success and "id" in new_invoice:
            invoice_id = new_invoice["id"]
            self.log_test("Create Invoice", True, f"ID: {invoice_id}")
        else:
            self.log_test("Create Invoice", False, f"Response: {new_invoice}")
        
        # Test 3: Update invoice status (if created successfully)
        if invoice_id:
            update_data = {"status": "sent"}
            success, response = self.make_request("PUT", f"/invoices/{invoice_id}", update_data)
            self.log_test("Update Invoice", success, f"Status: {response.get('status', 'N/A') if success else response}")
            
            # Test 4: Delete invoice
            success, response = self.make_request("DELETE", f"/invoices/{invoice_id}")
            self.log_test("Delete Invoice", success, "" if success else f"Response: {response}")

    def test_tax_calculators(self):
        """Test tax calculation endpoints"""
        print("\n💰 Testing Tax Calculators...")
        
        # Test 1: VAT calculation
        vat_data = {"revenue": 10000, "expenses": 2000, "tax_type": "vat", "rate": 20}
        success, response = self.make_request("POST", "/tax/calculate", vat_data)
        if success and "tax_amount" in response:
            self.log_test("VAT Calculator", True, f"Tax: ${response['tax_amount']}")
        else:
            self.log_test("VAT Calculator", False, f"Response: {response}")
        
        # Test 2: Withholding tax calculation
        withholding_data = {"revenue": 10000, "tax_type": "withholding", "rate": 15}
        success, response = self.make_request("POST", "/tax/calculate", withholding_data)
        if success and "tax_amount" in response:
            self.log_test("Withholding Tax Calculator", True, f"Tax: ${response['tax_amount']}")
        else:
            self.log_test("Withholding Tax Calculator", False, f"Response: {response}")
        
        # Test 3: Income tax calculation
        income_data = {"revenue": 100000, "expenses": 20000, "tax_type": "income"}
        success, response = self.make_request("POST", "/tax/calculate", income_data)
        if success and "total_tax" in response:
            self.log_test("Income Tax Calculator", True, f"Tax: ${response['total_tax']}")
        else:
            self.log_test("Income Tax Calculator", False, f"Response: {response}")
        
        # Test 4: Tax summary
        success, response = self.make_request("GET", "/tax/summary")
        self.log_test("Tax Summary", success, f"Revenue: ${response.get('total_revenue', 0) if success else 'N/A'}")

    def test_tax_vault(self):
        """Test tax vault operations"""
        print("\n🏦 Testing Tax Vault...")
        
        # Test 1: Get vault
        success, vault = self.make_request("GET", "/tax/vault")
        self.log_test("Get Tax Vault", success, f"Amount: ${vault.get('current_amount', 0) if success else 'N/A'}")
        
        # Test 2: Set target
        target_data = {"amount": 5000, "action": "set_target"}
        success, response = self.make_request("POST", "/tax/vault", target_data)
        self.log_test("Set Vault Target", success, f"Target: ${response.get('target_amount', 0) if success else 'N/A'}")
        
        # Test 3: Deposit
        deposit_data = {"amount": 1000, "action": "deposit", "note": "Test deposit"}
        success, response = self.make_request("POST", "/tax/vault", deposit_data)
        self.log_test("Vault Deposit", success, f"New amount: ${response.get('current_amount', 0) if success else 'N/A'}")
        
        # Test 4: Withdraw
        withdraw_data = {"amount": 500, "action": "withdraw", "note": "Test withdrawal"}
        success, response = self.make_request("POST", "/tax/vault", withdraw_data)
        self.log_test("Vault Withdraw", success, f"New amount: ${response.get('current_amount', 0) if success else 'N/A'}")

    def test_projects(self):
        """Test project management"""
        print("\n📋 Testing Projects...")
        
        # Test 1: List projects
        success, projects = self.make_request("GET", "/projects")
        self.log_test("List Projects", success, f"Count: {len(projects) if success else 'N/A'}")
        
        # Test 2: Create project
        project_data = {
            "name": "Test Project",
            "client_name": "Test Client",
            "budget": 5000,
            "description": "Test project description"
        }
        
        success, new_project = self.make_request("POST", "/projects", project_data)
        project_id = None
        if success and "id" in new_project:
            project_id = new_project["id"]
            self.log_test("Create Project", True, f"ID: {project_id}")
        else:
            self.log_test("Create Project", False, f"Response: {new_project}")
        
        # Test 3: Add milestone (if project created)
        if project_id:
            milestone_data = {
                "name": "Test Milestone",
                "amount": 1000,
                "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            }
            success, response = self.make_request("POST", f"/projects/{project_id}/milestones", milestone_data)
            self.log_test("Add Milestone", success, f"Milestone: {response.get('name', 'N/A') if success else response}")
            
            # Test 4: Delete project
            success, response = self.make_request("DELETE", f"/projects/{project_id}")
            self.log_test("Delete Project", success, "" if success else f"Response: {response}")

    def test_ai_advisor(self):
        """Test AI advisor chat"""
        print("\n🤖 Testing AI Advisor...")
        
        chat_data = {
            "message": "What are the main tax deductions for freelancers?",
            "session_id": f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        
        success, response = self.make_request("POST", "/ai/chat", chat_data)
        if success and "response" in response:
            ai_response = response["response"]
            self.log_test("AI Chat", True, f"Response length: {len(ai_response)} chars")
        else:
            self.log_test("AI Chat", False, f"Response: {response}")
        
        # Test chat history
        success, history = self.make_request("GET", "/ai/history")
        self.log_test("AI History", success, f"Messages: {len(history) if success else 'N/A'}")

    def test_fx_rates(self):
        """Test FX rates endpoint"""
        print("\n💱 Testing FX Rates...")
        
        success, response = self.make_request("GET", "/fx/rates?base=USD")
        if success and "rates" in response:
            rates_count = len(response["rates"])
            self.log_test("FX Rates", True, f"Currencies: {rates_count}")
        else:
            self.log_test("FX Rates", False, f"Response: {response}")

    def test_clients(self):
        """Test client management"""
        print("\n👥 Testing Clients...")
        
        # Test 1: List clients
        success, clients = self.make_request("GET", "/clients")
        self.log_test("List Clients", success, f"Count: {len(clients) if success else 'N/A'}")
        
        # Test 2: Create client
        client_data = {
            "name": "Test Client",
            "email": "testclient@example.com",
            "company": "Test Company",
            "phone": "+1234567890"
        }
        
        success, new_client = self.make_request("POST", "/clients", client_data)
        if success and "id" in new_client:
            self.log_test("Create Client", True, f"ID: {new_client['id']}")
        else:
            self.log_test("Create Client", False, f"Response: {new_client}")

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Keeps API Test Suite")
        print(f"Backend URL: {self.base_url}")
        print(f"Test User: {self.test_email}")
        print("=" * 60)
        
        try:
            self.test_auth_flow()
            self.test_dashboard()
            self.test_invoices()
            self.test_tax_calculators()
            self.test_tax_vault()
            self.test_projects()
            self.test_ai_advisor()
            self.test_fx_rates()
            self.test_clients()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {e}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️  Warning: Low success rate detected")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = KeepsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "tests_passed": tester.tests_passed,
            "tests_run": tester.tests_run,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
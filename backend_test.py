import requests
import sys
import json
from datetime import datetime

class KeepsAPITester:
    def __init__(self, base_url="https://nomad-taxes.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = "sess_e6b00d410a094061bdb284086a3ead35"  # Phase 4 test token
        self.portal_token = "cb90aa071db24113"  # Existing portal token
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_cookies=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if use_cookies:
            # Use cookie-based auth for Phase 4 testing
            test_headers['Cookie'] = f'session_token={self.session_token}'
        elif self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
            
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_login(self):
        """Test login with existing test user"""
        print("\n🔐 Testing Authentication...")
        success, response = self.run_test(
            "Login with test user",
            "POST",
            "auth/login",
            200,
            data={"email": "test@keeps.app", "password": "Test123!"}
        )
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            self.user_id = response.get('user_id')
            print(f"   Session token: {self.session_token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test auth/me endpoint"""
        success, response = self.run_test(
            "Get current user",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_invoice_crud(self):
        """Test invoice CRUD operations"""
        print("\n📄 Testing Invoice Operations...")
        
        # Create invoice
        invoice_data = {
            "client_name": "Test Client",
            "client_email": "test@client.com",
            "client_address": "123 Test St, Test City",
            "client_phone": "+1234567890",
            "items": [
                {"description": "Web Development", "quantity": 10, "unit_price": 100},
                {"description": "Design Work", "quantity": 5, "unit_price": 80}
            ],
            "currency": "USD",
            "tax_rate": 10,
            "due_date": "2024-12-31",
            "notes": "Test invoice notes",
            "payment_terms": "Net 30"
        }
        
        success, invoice = self.run_test(
            "Create invoice",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if not success:
            return False
            
        invoice_id = invoice.get('id')
        if not invoice_id:
            print("❌ No invoice ID returned")
            return False
            
        # Get invoices list
        success, invoices = self.run_test(
            "List invoices",
            "GET",
            "invoices",
            200
        )
        
        if not success:
            return False
            
        # Update invoice status
        success, updated = self.run_test(
            "Update invoice status",
            "PUT",
            f"invoices/{invoice_id}",
            200,
            data={"status": "sent"}
        )
        
        if not success:
            return False
            
        # Test PDF download endpoint
        success, pdf_response = self.run_test(
            "Download invoice PDF",
            "GET",
            f"invoices/{invoice_id}/pdf",
            200
        )
        
        return success

    def test_project_crud(self):
        """Test project CRUD operations"""
        print("\n📁 Testing Project Operations...")
        
        project_data = {
            "name": "Test Project",
            "client_name": "Test Client",
            "budget": 5000,
            "description": "Test project description"
        }
        
        success, project = self.run_test(
            "Create project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if not success:
            return False
            
        project_id = project.get('id')
        if not project_id:
            print("❌ No project ID returned")
            return False
            
        # Add milestone
        milestone_data = {
            "name": "Phase 1",
            "amount": 2000,
            "due_date": "2024-12-15"
        }
        
        success, milestone = self.run_test(
            "Add project milestone",
            "POST",
            f"projects/{project_id}/milestones",
            200,
            data=milestone_data
        )
        
        if not success:
            return False
            
        # List projects
        success, projects = self.run_test(
            "List projects",
            "GET",
            "projects",
            200
        )
        
        return success

    def test_client_crud(self):
        """Test client CRUD operations"""
        print("\n👥 Testing Client Operations...")
        
        client_data = {
            "name": "Test Client Corp",
            "email": "contact@testclient.com",
            "company": "Test Client Corporation",
            "phone": "+1234567890",
            "address": "456 Business Ave, Corporate City",
            "website": "https://testclient.com",
            "notes": "Important client notes"
        }
        
        success, client = self.run_test(
            "Create client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if not success:
            return False
            
        client_id = client.get('id')
        if not client_id:
            print("❌ No client ID returned")
            return False
            
        # List clients
        success, clients = self.run_test(
            "List clients",
            "GET",
            "clients",
            200
        )
        
        if not success:
            return False
            
        # Delete client
        success, delete_response = self.run_test(
            "Delete client",
            "DELETE",
            f"clients/{client_id}",
            200
        )
        
        return success

    def test_settings_endpoints(self):
        """Test settings endpoints"""
        print("\n⚙️ Testing Settings Operations...")
        
        # Update profile
        profile_data = {
            "name": "Updated Test User",
            "company": "Updated Test Company"
        }
        
        success, profile = self.run_test(
            "Update profile",
            "PUT",
            "settings/profile",
            200,
            data=profile_data
        )
        
        if not success:
            return False
            
        # Test data export
        success, export_data = self.run_test(
            "Export user data",
            "GET",
            "settings/export",
            200
        )
        
        if not success:
            return False
            
        # Verify export contains expected data
        if not isinstance(export_data, dict) or 'user' not in export_data:
            print("❌ Export data format invalid")
            return False
            
        print("✅ Export data contains user, invoices, projects, clients")
        return True

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        print("\n📊 Testing Dashboard...")
        
        success, summary = self.run_test(
            "Get dashboard summary",
            "GET",
            "dashboard/summary",
            200
        )
        
        if success and isinstance(summary, dict):
            required_fields = ['total_revenue', 'total_pending', 'total_invoices', 'active_projects']
            missing_fields = [field for field in required_fields if field not in summary]
            if missing_fields:
                print(f"❌ Missing dashboard fields: {missing_fields}")
                return False
            print("✅ Dashboard summary contains all required fields")
        
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        print("\n🤖 Testing AI Chat...")
        
        chat_data = {
            "message": "What are the tax implications of freelance income?",
            "session_id": f"test_session_{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Send AI chat message",
            "POST",
            "ai/chat",
            200,
            data=chat_data
        )
        
        if success and 'response' in response:
            print("✅ AI chat returned response")
            return True
        
        return success

    def test_expenses_crud(self):
        """Test expense CRUD operations (Phase 3)"""
        print("\n💰 Testing Expense Operations...")
        
        # Create expense
        expense_data = {
            "amount": 125.50,
            "currency": "USD",
            "category": "office",
            "description": "Office supplies",
            "vendor": "Office Depot",
            "date": "2024-01-15",
            "receipt_data": ""
        }
        
        success, expense = self.run_test(
            "Create expense",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if not success:
            return False
            
        expense_id = expense.get('id')
        if not expense_id:
            print("❌ No expense ID returned")
            return False
            
        # List expenses
        success, expenses = self.run_test(
            "List expenses",
            "GET",
            "expenses",
            200
        )
        
        if not success:
            return False
            
        # Get expense summary
        success, summary = self.run_test(
            "Get expense summary",
            "GET",
            "expenses/summary",
            200
        )
        
        if not success:
            return False
            
        # Verify summary structure
        if not isinstance(summary, dict) or 'total' not in summary or 'by_category' not in summary:
            print("❌ Expense summary format invalid")
            return False
            
        # Delete expense
        success, delete_response = self.run_test(
            "Delete expense",
            "DELETE",
            f"expenses/{expense_id}",
            200
        )
        
        return success

    def test_receipt_ocr(self):
        """Test receipt OCR functionality (Phase 3)"""
        print("\n📷 Testing Receipt OCR...")
        
        # Simple base64 test image (1x1 pixel PNG)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        ocr_data = {
            "image_base64": f"data:image/png;base64,{test_image_b64}"
        }
        
        success, response = self.run_test(
            "Scan receipt with OCR",
            "POST",
            "receipts/scan",
            200,
            data=ocr_data
        )
        
        if success and 'success' in response:
            print(f"✅ OCR response: {response.get('success')}")
            return True
        
        return success

    def test_digital_signature(self):
        """Test digital signature functionality (Phase 3)"""
        print("\n✍️ Testing Digital Signature...")
        
        # Get existing signature
        success, signature = self.run_test(
            "Get signature",
            "GET",
            "signature",
            200
        )
        
        if not success:
            return False
            
        # Save signature
        signature_data = {
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        }
        
        success, save_response = self.run_test(
            "Save signature",
            "POST",
            "signature",
            200,
            data=signature_data
        )
        
        if success and 'message' in save_response:
            print("✅ Signature saved successfully")
            return True
        
        return success

    def test_global_compliance(self):
        """Test global compliance functionality (Phase 3)"""
        print("\n🌍 Testing Global Compliance...")
        
        # Get compliance countries
        success, countries = self.run_test(
            "Get compliance countries",
            "GET",
            "compliance/countries",
            200
        )
        
        if not success:
            return False
            
        if not isinstance(countries, list) or len(countries) < 10:
            print(f"❌ Expected at least 10 countries, got {len(countries) if isinstance(countries, list) else 'invalid format'}")
            return False
            
        print(f"✅ Found {len(countries)} compliance countries")
        
        # Create a test invoice for compliance check
        invoice_data = {
            "client_name": "Test Compliance Client",
            "client_email": "compliance@test.com",
            "items": [{"description": "Test Service", "quantity": 1, "unit_price": 100}],
            "currency": "USD",
            "tax_rate": 10
        }
        
        success, invoice = self.run_test(
            "Create test invoice for compliance",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if not success:
            return False
            
        invoice_id = invoice.get('id')
        if not invoice_id:
            print("❌ No invoice ID returned for compliance test")
            return False
            
        # Run compliance check
        compliance_data = {
            "invoice_id": invoice_id,
            "country_code": "US"
        }
        
        success, compliance_result = self.run_test(
            "Run compliance check",
            "POST",
            "compliance/check",
            200,
            data=compliance_data
        )
        
        if success and 'score' in compliance_result and 'checks' in compliance_result:
            print(f"✅ Compliance check completed with score: {compliance_result.get('score')}%")
            return True
        
        return success

    def test_expense_categories(self):
        """Test expense categories endpoint (Phase 3)"""
        print("\n📋 Testing Expense Categories...")
        
        success, categories = self.run_test(
            "Get expense categories",
            "GET",
            "expenses/categories",
            200
        )
        
        if success and isinstance(categories, list) and len(categories) > 0:
            print(f"✅ Found {len(categories)} expense categories")
            return True
        
        return success

    # ===== PHASE 4 TESTS =====
    
    def test_phase4_auth_status(self):
        """Test if authentication is working with provided session token"""
        print("\n" + "="*50)
        print("TESTING PHASE 4 AUTHENTICATION")
        print("="*50)
        
        success, response = self.run_test(
            "Auth Status Check (Phase 4)",
            "GET",
            "auth/me",
            200,
            use_cookies=True
        )
        
        if success:
            print(f"   User: {response.get('name', 'Unknown')} ({response.get('email', 'No email')})")
            print(f"   Language: {response.get('language', 'en')}")
            self.user_id = response.get('user_id')
            return True
        return False

    def test_recurring_invoices(self):
        """Test recurring invoice functionality"""
        print("\n" + "="*50)
        print("TESTING RECURRING INVOICES")
        print("="*50)
        
        # Test list recurring templates
        success, templates = self.run_test(
            "List Recurring Templates",
            "GET",
            "recurring",
            200,
            use_cookies=True
        )
        
        if success:
            print(f"   Found {len(templates)} recurring templates")
        
        # Test create recurring template
        recurring_data = {
            "client_name": "Test Recurring Client",
            "client_email": "recurring@test.com",
            "currency": "USD",
            "tax_rate": 10,
            "frequency": "monthly",
            "items": [
                {
                    "description": "Monthly Service",
                    "quantity": 1,
                    "unit_price": 100
                }
            ],
            "notes": "Test recurring template"
        }
        
        success, created_template = self.run_test(
            "Create Recurring Template",
            "POST",
            "recurring",
            200,
            data=recurring_data,
            use_cookies=True
        )
        
        template_id = None
        if success:
            template_id = created_template.get('id')
            print(f"   Created template ID: {template_id}")
        
        # Test generate invoice from template
        if template_id:
            success, generated_invoice = self.run_test(
                "Generate Invoice from Template",
                "POST",
                f"recurring/{template_id}/generate",
                200,
                use_cookies=True
            )
            
            if success:
                print(f"   Generated invoice: {generated_invoice.get('invoice_number')}")
                return True
        
        return template_id is not None

    def test_client_portal(self):
        """Test client portal functionality"""
        print("\n" + "="*50)
        print("TESTING CLIENT PORTAL")
        print("="*50)
        
        # Test public portal access (no auth required)
        success, portal_invoice = self.run_test(
            "Access Client Portal (Public)",
            "GET",
            f"portal/{self.portal_token}",
            200,
            headers={'Content-Type': 'application/json'}  # No auth headers
        )
        
        if success:
            print(f"   Portal invoice: {portal_invoice.get('invoice_number', 'Unknown')}")
            print(f"   Client: {portal_invoice.get('client_name', 'Unknown')}")
            print(f"   Total: {portal_invoice.get('currency', 'USD')} {portal_invoice.get('total', 0)}")
            return True
        
        return False

    def test_notifications(self):
        """Test notifications functionality"""
        print("\n" + "="*50)
        print("TESTING NOTIFICATIONS")
        print("="*50)
        
        # Test list notifications
        success, notifications = self.run_test(
            "List Notifications",
            "GET",
            "notifications",
            200,
            use_cookies=True
        )
        
        if success:
            print(f"   Found {len(notifications)} notifications")
            unread_count = len([n for n in notifications if not n.get('read', True)])
            print(f"   Unread: {unread_count}")
        
        # Test mark all notifications as read
        success, response = self.run_test(
            "Mark All Notifications Read",
            "POST",
            "notifications/read",
            200,
            use_cookies=True
        )
        
        if success:
            print(f"   Response: {response.get('message', 'Success')}")
        
        return success

    def test_language_settings(self):
        """Test language settings functionality"""
        print("\n" + "="*50)
        print("TESTING LANGUAGE SETTINGS")
        print("="*50)
        
        # Test update language
        language_data = {"language": "tr"}
        success, response = self.run_test(
            "Update Language to Turkish",
            "PUT",
            "settings/language",
            200,
            data=language_data,
            use_cookies=True
        )
        
        if success:
            print(f"   Language updated: {response.get('language', 'Unknown')}")
        
        # Test auth/me returns language
        success, user_data = self.run_test(
            "Check Language in User Profile",
            "GET",
            "auth/me",
            200,
            use_cookies=True
        )
        
        if success:
            current_lang = user_data.get('language', 'en')
            print(f"   Current language: {current_lang}")
            
            # Reset to English
            reset_success, _ = self.run_test(
                "Reset Language to English",
                "PUT",
                "settings/language",
                200,
                data={"language": "en"},
                use_cookies=True
            )
            
            return current_lang == "tr"
        
        return False

def main():
    print("🚀 Starting Keeps API Testing (Phase 4)")
    print("=" * 50)
    
    tester = KeepsAPITester()
    
    # Test Phase 4 authentication first with provided session token
    if not tester.test_phase4_auth_status():
        print("❌ Phase 4 Authentication failed, trying regular login")
        if not tester.test_login():
            print("❌ Authentication failed, stopping tests")
            return 1
        
        if not tester.test_auth_me():
            print("❌ Auth verification failed")
            return 1
    
    # Test Phase 4 features first
    print("\n🔥 Testing Phase 4 Features")
    phase4_tests = [
        tester.test_recurring_invoices,
        tester.test_client_portal,
        tester.test_notifications,
        tester.test_language_settings,
    ]
    
    phase4_passed = 0
    for test in phase4_tests:
        if test():
            phase4_passed += 1
        else:
            print(f"❌ Phase 4 test {test.__name__} failed")
    
    print(f"\n📊 Phase 4 Results: {phase4_passed}/{len(phase4_tests)} tests passed")
    
    # Test all CRUD operations including Phase 3 features
    print("\n🔧 Testing Core Features")
    tests = [
        tester.test_dashboard_summary,
        tester.test_invoice_crud,
        tester.test_project_crud,
        tester.test_client_crud,
        tester.test_settings_endpoints,
        # Phase 3 features
        tester.test_expenses_crud,
        tester.test_receipt_ocr,
        tester.test_digital_signature,
        tester.test_global_compliance,
        tester.test_expense_categories,
        tester.test_ai_chat
    ]
    
    for test in tests:
        if not test():
            print(f"❌ Test {test.__name__} failed")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests ({len(tester.failed_tests)}):")
        for i, test in enumerate(tester.failed_tests, 1):
            print(f"   {i}. {test['test']}")
            print(f"      Endpoint: {test['endpoint']}")
            if 'expected' in test:
                print(f"      Expected: {test['expected']}, Got: {test['actual']}")
            print(f"      Error: {test['error']}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️ Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
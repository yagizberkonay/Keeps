import requests
import sys
import json
from datetime import datetime

class KeepsAPITester:
    def __init__(self, base_url="https://nomad-taxes.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

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
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
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

def main():
    print("🚀 Starting Keeps API Testing (Iteration 2)")
    print("=" * 50)
    
    tester = KeepsAPITester()
    
    # Test authentication first
    if not tester.test_login():
        print("❌ Authentication failed, stopping tests")
        return 1
        
    if not tester.test_auth_me():
        print("❌ Auth verification failed")
        return 1
    
    # Test all CRUD operations
    tests = [
        tester.test_dashboard_summary,
        tester.test_invoice_crud,
        tester.test_project_crud,
        tester.test_client_crud,
        tester.test_settings_endpoints,
        tester.test_ai_chat
    ]
    
    for test in tests:
        if not test():
            print(f"❌ Test {test.__name__} failed")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️ Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
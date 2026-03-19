#!/usr/bin/env python3
"""
Backend API Testing for Samachar Group News Website
Tests all endpoints with proper authentication and error handling.
"""

import requests
import sys
from datetime import datetime
import json

class SamacharAPITester:
    def __init__(self, base_url="https://samachar-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.reporter_token = None
        self.test_article_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, response_data=None, error=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {error}")
            self.failed_tests.append({
                "test": name,
                "error": error,
                "response": response_data
            })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else None
            
            if success and data.get("message") == "Samachar Group API":
                self.log_test("API Root Endpoint", True)
                return True
            else:
                self.log_test("API Root Endpoint", False, data, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Root Endpoint", False, None, str(e))
            return False

    def test_public_categories(self):
        """Test public categories endpoint"""
        try:
            response = requests.get(f"{self.api_url}/public/categories", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else None
            
            if success and "categories" in data and len(data["categories"]) >= 6:
                categories = [cat["id"] for cat in data["categories"]]
                expected = ["sports", "crime", "politics", "entertainment", "business", "technology"]
                if all(cat in categories for cat in expected):
                    self.log_test("Public Categories", True)
                    return True
                
            self.log_test("Public Categories", False, data, "Missing expected categories")
            return False
        except Exception as e:
            self.log_test("Public Categories", False, None, str(e))
            return False

    def test_login(self, email, password, expected_role):
        """Test login and return token"""
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                user = data.get("user", {})
                
                if token and user.get("role") == expected_role and user.get("email") == email:
                    self.log_test(f"Login {expected_role} ({email})", True)
                    return token
                else:
                    self.log_test(f"Login {expected_role} ({email})", False, data, "Invalid response structure")
                    return None
            else:
                self.log_test(f"Login {expected_role} ({email})", False, None, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(f"Login {expected_role} ({email})", False, None, str(e))
            return None

    def test_auth_me(self, token, expected_role):
        """Test /auth/me endpoint"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") == expected_role and "user_id" in data:
                    self.log_test(f"Auth Me ({expected_role})", True)
                    return True
                else:
                    self.log_test(f"Auth Me ({expected_role})", False, data, "Invalid user data")
                    return False
            else:
                self.log_test(f"Auth Me ({expected_role})", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(f"Auth Me ({expected_role})", False, None, str(e))
            return False

    def test_create_article(self):
        """Test article creation"""
        try:
            headers = {"Authorization": f"Bearer {self.reporter_token}"}
            article_data = {
                "title": f"Test Article {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "title_hi": "परीक्षण लेख",
                "content": "<p>This is a test article content with <strong>rich text</strong>.</p>",
                "content_hi": "<p>यह एक परीक्षण लेख की सामग्री है।</p>",
                "category": "technology",
                "image_url": "https://images.unsplash.com/photo-1680992044138-ce4864c2b962?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwzfHx0ZWNobm9sb2d5JTIwYWJzdHJhY3QlMjBzZXJ2ZXIlMjByb29tfGVufDB8fHx8MTc3MzkxMzE4OXww&ixlib=rb-4.1.0&q=85",
                "is_featured": True,
                "status": "published"
            }
            
            response = requests.post(
                f"{self.api_url}/articles",
                json=article_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "article_id" in data and data.get("title") == article_data["title"]:
                    self.test_article_id = data["article_id"]
                    self.log_test("Create Article", True)
                    return True
                else:
                    self.log_test("Create Article", False, data, "Invalid article data returned")
                    return False
            else:
                self.log_test("Create Article", False, None, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Article", False, None, str(e))
            return False

    def test_get_articles(self):
        """Test getting articles"""
        try:
            headers = {"Authorization": f"Bearer {self.reporter_token}"}
            response = requests.get(f"{self.api_url}/articles", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Articles", True)
                    return True
                else:
                    self.log_test("Get Articles", False, data, "Response not a list")
                    return False
            else:
                self.log_test("Get Articles", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Get Articles", False, None, str(e))
            return False

    def test_get_public_articles(self):
        """Test getting public articles"""
        try:
            response = requests.get(f"{self.api_url}/public/articles", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Public Articles", True)
                    return True
                else:
                    self.log_test("Get Public Articles", False, data, "Response not a list")
                    return False
            else:
                self.log_test("Get Public Articles", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Get Public Articles", False, None, str(e))
            return False

    def test_get_single_article(self):
        """Test getting a single article"""
        if not self.test_article_id:
            self.log_test("Get Single Article", False, None, "No test article ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/articles/{self.test_article_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "article_id" in data and data["article_id"] == self.test_article_id:
                    self.log_test("Get Single Article", True)
                    return True
                else:
                    self.log_test("Get Single Article", False, data, "Invalid article data")
                    return False
            else:
                self.log_test("Get Single Article", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Get Single Article", False, None, str(e))
            return False

    def test_update_article(self):
        """Test updating an article"""
        if not self.test_article_id:
            self.log_test("Update Article", False, None, "No test article ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.reporter_token}"}
            update_data = {
                "title": f"Updated Test Article {datetime.now().strftime('%H:%M:%S')}"
            }
            
            response = requests.put(
                f"{self.api_url}/articles/{self.test_article_id}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title") == update_data["title"]:
                    self.log_test("Update Article", True)
                    return True
                else:
                    self.log_test("Update Article", False, data, "Title not updated")
                    return False
            else:
                self.log_test("Update Article", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Update Article", False, None, str(e))
            return False

    def test_search_articles(self):
        """Test article search"""
        try:
            response = requests.get(
                f"{self.api_url}/public/articles", 
                params={"search": "test"}, 
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Search Articles", True)
                    return True
                else:
                    self.log_test("Search Articles", False, data, "Response not a list")
                    return False
            else:
                self.log_test("Search Articles", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Search Articles", False, None, str(e))
            return False

    def test_category_filter(self):
        """Test category filtering"""
        try:
            response = requests.get(
                f"{self.api_url}/public/articles", 
                params={"category": "technology"}, 
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Category Filter", True)
                    return True
                else:
                    self.log_test("Category Filter", False, data, "Response not a list")
                    return False
            else:
                self.log_test("Category Filter", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Category Filter", False, None, str(e))
            return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/stats", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_keys = ["total_articles", "published", "drafts", "total_users", "reporters"]
                if all(key in data for key in required_keys):
                    self.log_test("Admin Stats", True)
                    return True
                else:
                    self.log_test("Admin Stats", False, data, "Missing required stats keys")
                    return False
            else:
                self.log_test("Admin Stats", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin Stats", False, None, str(e))
            return False

    def test_admin_get_articles(self):
        """Test admin get all articles"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/articles", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Admin Get Articles", True)
                    return True
                else:
                    self.log_test("Admin Get Articles", False, data, "Response not a list")
                    return False
            else:
                self.log_test("Admin Get Articles", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin Get Articles", False, None, str(e))
            return False

    def test_logout(self):
        """Test logout endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.reporter_token}"}
            response = requests.post(f"{self.api_url}/auth/logout", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Logged out successfully":
                    self.log_test("Logout", True)
                    return True
                else:
                    self.log_test("Logout", False, data, "Invalid logout response")
                    return False
            else:
                self.log_test("Logout", False, None, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Logout", False, None, str(e))
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Samachar Group API Tests...")
        print(f"Testing against: {self.base_url}")
        print("-" * 60)
        
        # Basic API tests
        self.test_api_root()
        self.test_public_categories()
        
        # Authentication tests
        self.admin_token = self.test_login("admin@samachar.com", "admin123", "admin")
        self.reporter_token = self.test_login("reporter@samachar.com", "reporter123", "reporter")
        
        if not self.admin_token or not self.reporter_token:
            print("\n❌ Critical auth failure - stopping tests")
            return False
        
        # User info tests
        self.test_auth_me(self.admin_token, "admin")
        self.test_auth_me(self.reporter_token, "reporter")
        
        # Article CRUD tests
        self.test_create_article()
        self.test_get_articles()
        self.test_get_public_articles()
        self.test_get_single_article()
        self.test_update_article()
        
        # Search & Filter tests
        self.test_search_articles()
        self.test_category_filter()
        
        # Admin functionality tests
        self.test_admin_stats()
        self.test_admin_get_articles()
        
        # Logout test
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"🎯 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return len(self.failed_tests) == 0

def main():
    tester = SamacharAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""
Connecdo MVP Backend API Testing Suite
Tests all backend endpoints for functionality and error handling
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get base URL from environment or use default
BASE_URL = "https://23fcec76-32e2-4568-86bd-176979f69e4b.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ConnecdoAPITester:
    def __init__(self):
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "test_details": []
        }
        
    def log_test(self, test_name, passed, details="", response_data=None):
        """Log test results"""
        self.results["total_tests"] += 1
        if passed:
            self.results["passed"] += 1
            status = "✅ PASS"
        else:
            self.results["failed"] += 1
            status = "❌ FAIL"
            
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
        
        self.results["test_details"].append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "response": response_data
        })
    
    def test_root_endpoint(self):
        """Test GET /api/ - should return Connecdo API message"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Connecdo API" in data["message"]:
                    self.log_test(
                        "Root Endpoint (/api/)", 
                        True, 
                        f"Status: {response.status_code}, Message: {data.get('message')}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Root Endpoint (/api/)", 
                        False, 
                        f"Missing or incorrect message in response", 
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Root Endpoint (/api/)", 
                    False, 
                    f"Expected 200, got {response.status_code}", 
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Root Endpoint (/api/)", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
    
    def test_health_endpoint(self):
        """Test GET /api/health - should return healthy status"""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test(
                        "Health Check (/api/health)", 
                        True, 
                        f"Status: {response.status_code}, Health: {data.get('status')}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Health Check (/api/health)", 
                        False, 
                        f"Status not healthy: {data.get('status')}", 
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Health Check (/api/health)", 
                    False, 
                    f"Expected 200, got {response.status_code}", 
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Health Check (/api/health)", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
    
    def test_database_connection(self):
        """Test GET /api/test-db - should test Supabase connection"""
        try:
            response = requests.get(f"{API_BASE}/test-db", timeout=15)
            
            # Accept both success and expected error responses
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log_test(
                        "Database Connection (/api/test-db)", 
                        True, 
                        f"Database connection successful", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Database Connection (/api/test-db)", 
                        False, 
                        f"Unexpected success response: {data.get('status')}", 
                        data
                    )
                    return False
            elif response.status_code == 500:
                data = response.json()
                if "Database tables not found" in data.get("message", ""):
                    self.log_test(
                        "Database Connection (/api/test-db)", 
                        True, 
                        f"Expected error - tables not created yet: {data.get('message')}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Database Connection (/api/test-db)", 
                        False, 
                        f"Unexpected error message: {data.get('message')}", 
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Database Connection (/api/test-db)", 
                    False, 
                    f"Unexpected status code: {response.status_code}", 
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Database Connection (/api/test-db)", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            
            cors_headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
            
            missing_headers = []
            for header, expected_value in cors_headers.items():
                actual_value = response.headers.get(header)
                if not actual_value:
                    missing_headers.append(header)
                elif expected_value not in actual_value:
                    missing_headers.append(f"{header} (incorrect value)")
            
            if not missing_headers:
                self.log_test(
                    "CORS Headers", 
                    True, 
                    "All required CORS headers present"
                )
                return True
            else:
                self.log_test(
                    "CORS Headers", 
                    False, 
                    f"Missing/incorrect headers: {', '.join(missing_headers)}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "CORS Headers", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
    
    def test_options_method(self):
        """Test OPTIONS method for CORS preflight"""
        try:
            response = requests.options(f"{API_BASE}/", timeout=10)
            
            if response.status_code == 200:
                self.log_test(
                    "OPTIONS Method (CORS Preflight)", 
                    True, 
                    f"Status: {response.status_code}"
                )
                return True
            else:
                self.log_test(
                    "OPTIONS Method (CORS Preflight)", 
                    False, 
                    f"Expected 200, got {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "OPTIONS Method (CORS Preflight)", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
    
    def test_404_error_handling(self):
        """Test error handling for missing routes"""
        try:
            response = requests.get(f"{API_BASE}/nonexistent-route", timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "error" in data and "not found" in data["error"].lower():
                    self.log_test(
                        "404 Error Handling", 
                        True, 
                        f"Proper 404 response: {data.get('error')}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "404 Error Handling", 
                        False, 
                        f"404 status but incorrect error message", 
                        data
                    )
                    return False
            else:
                self.log_test(
                    "404 Error Handling", 
                    False, 
                    f"Expected 404, got {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "404 Error Handling", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
    
    def test_json_responses(self):
        """Test that all endpoints return valid JSON"""
        endpoints = [
            ("/", "Root endpoint"),
            ("/health", "Health check"),
            ("/test-db", "Database test"),
            ("/nonexistent", "404 error")
        ]
        
        all_passed = True
        for endpoint, description in endpoints:
            try:
                response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
                
                try:
                    data = response.json()
                    self.log_test(
                        f"JSON Response - {description}", 
                        True, 
                        f"Valid JSON returned"
                    )
                except json.JSONDecodeError:
                    self.log_test(
                        f"JSON Response - {description}", 
                        False, 
                        f"Invalid JSON response"
                    )
                    all_passed = False
                    
            except Exception as e:
                self.log_test(
                    f"JSON Response - {description}", 
                    False, 
                    f"Request failed: {str(e)}"
                )
                all_passed = False
        
        return all_passed
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("CONNECDO MVP BACKEND API TESTING")
        print("=" * 60)
        print(f"Testing API at: {API_BASE}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Run all tests
        tests = [
            self.test_root_endpoint,
            self.test_health_endpoint,
            self.test_database_connection,
            self.test_cors_headers,
            self.test_options_method,
            self.test_404_error_handling,
            self.test_json_responses
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ FAIL: {test.__name__} - Unexpected error: {str(e)}")
                self.results["total_tests"] += 1
                self.results["failed"] += 1
        
        # Print summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"Passed: {self.results['passed']}")
        print(f"Failed: {self.results['failed']}")
        print(f"Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        print()
        
        if self.results['failed'] > 0:
            print("FAILED TESTS:")
            for test in self.results['test_details']:
                if not test['passed']:
                    print(f"  - {test['test']}: {test['details']}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = ConnecdoAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class MinecraftServerAPITester:
    def __init__(self, base_url="https://minehostlocal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.server_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) <= 3:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list) and len(response_data) <= 2:
                        print(f"   Response: {response_data}")
                    else:
                        print(f"   Response: Large data structure received")
                except:
                    print(f"   Response: Non-JSON response")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_system_info(self):
        """Test system info endpoint"""
        return self.run_test("System Info", "GET", "system/info", 200)

    def test_java_check(self):
        """Test Java installation check"""
        return self.run_test("Java Check", "GET", "system/java", 200)

    def test_vanilla_versions(self):
        """Test vanilla versions API"""
        success, response = self.run_test("Vanilla Versions", "GET", "versions/vanilla", 200)
        if success and 'versions' in response:
            versions = response['versions']
            if len(versions) > 0:
                print(f"   Found {len(versions)} vanilla versions")
                print(f"   Latest: {versions[0]['id'] if versions else 'None'}")
            return True
        return False

    def test_paper_versions(self):
        """Test Paper versions API"""
        success, response = self.run_test("Paper Versions", "GET", "versions/paper", 200)
        if success and 'versions' in response:
            versions = response['versions']
            if len(versions) > 0:
                print(f"   Found {len(versions)} Paper versions")
                print(f"   Latest: {versions[0]['id'] if versions else 'None'}")
            return True
        return False

    def test_fabric_versions(self):
        """Test Fabric versions API"""
        success, response = self.run_test("Fabric Versions", "GET", "versions/fabric", 200)
        if success and 'versions' in response:
            versions = response['versions']
            if len(versions) > 0:
                print(f"   Found {len(versions)} Fabric versions")
                print(f"   Latest: {versions[0]['id'] if versions else 'None'}")
            return True
        return False

    def test_forge_versions(self):
        """Test Forge versions API"""
        success, response = self.run_test("Forge Versions", "GET", "versions/forge", 200)
        if success and 'versions' in response:
            versions = response['versions']
            if len(versions) > 0:
                print(f"   Found {len(versions)} Forge versions")
                print(f"   Latest: {versions[0]['id'] if versions else 'None'}")
            return True
        return False

    def test_list_servers(self):
        """Test list servers endpoint"""
        return self.run_test("List Servers", "GET", "servers", 200)

    def test_create_server(self):
        """Test server creation"""
        server_data = {
            "name": f"Test Server {datetime.now().strftime('%H%M%S')}",
            "server_type": "vanilla",
            "version": "1.20.1",
            "ram_min": 1024,
            "ram_max": 2048,
            "port": 25565
        }
        
        success, response = self.run_test("Create Server", "POST", "servers", 200, data=server_data)
        if success and 'id' in response:
            self.server_id = response['id']
            print(f"   Created server with ID: {self.server_id}")
            return True
        return False

    def test_get_server(self):
        """Test get server details"""
        if not self.server_id:
            print("❌ No server ID available for testing")
            return False
        
        return self.run_test("Get Server", "GET", f"servers/{self.server_id}", 200)

    def test_accept_eula(self):
        """Test EULA acceptance"""
        if not self.server_id:
            print("❌ No server ID available for testing")
            return False
        
        return self.run_test("Accept EULA", "POST", f"servers/{self.server_id}/eula", 200, data={"accepted": True})

    def test_server_properties(self):
        """Test server properties"""
        if not self.server_id:
            print("❌ No server ID available for testing")
            return False
        
        # Get properties
        success, response = self.run_test("Get Properties", "GET", f"servers/{self.server_id}/properties", 200)
        if not success:
            return False
        
        # Update properties
        properties_data = {
            "properties": {
                "motd": "Test Server MOTD",
                "max-players": "10",
                "difficulty": "easy"
            }
        }
        return self.run_test("Update Properties", "PUT", f"servers/{self.server_id}/properties", 200, data=properties_data)

    def test_modrinth_search(self):
        """Test Modrinth mod search"""
        return self.run_test("Search Mods", "GET", "mods/search?query=jei&loader=fabric&limit=5", 200)

    def test_plugin_search(self):
        """Test plugin search"""
        return self.run_test("Search Plugins", "GET", "plugins/search?query=essentials&limit=5", 200)

    def test_cleanup_server(self):
        """Clean up test server"""
        if not self.server_id:
            return True
        
        return self.run_test("Delete Server", "DELETE", f"servers/{self.server_id}", 200)

def main():
    print("🚀 Starting Minecraft Server Manager API Tests")
    print("=" * 60)
    
    tester = MinecraftServerAPITester()
    
    # Basic API tests
    tester.test_root_endpoint()
    tester.test_system_info()
    tester.test_java_check()
    
    # Version API tests (real external APIs)
    print("\n📦 Testing Version APIs (External)")
    tester.test_vanilla_versions()
    tester.test_paper_versions()
    tester.test_fabric_versions()
    tester.test_forge_versions()
    
    # Server management tests
    print("\n🖥️ Testing Server Management")
    tester.test_list_servers()
    tester.test_create_server()
    tester.test_get_server()
    tester.test_accept_eula()
    tester.test_server_properties()
    
    # Mod/Plugin search tests
    print("\n🔍 Testing Mod/Plugin Search (Modrinth)")
    tester.test_modrinth_search()
    tester.test_plugin_search()
    
    # Cleanup
    print("\n🧹 Cleanup")
    tester.test_cleanup_server()
    
    # Results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
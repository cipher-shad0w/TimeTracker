#!/usr/bin/env python3
import unittest
import sys
import os

# Add the parent directory to the path so we can import the modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the test modules
from tests.test_data_manager import TestTimeDataManager
from tests.test_tabs import TestTabs
from tests.test_ui import TestApp
from tests.test_integration import TestIntegration


def run_tests():
    """Run all tests for the time tracking application"""
    # Create a test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestTimeDataManager))
    test_suite.addTest(unittest.makeSuite(TestTabs))
    test_suite.addTest(unittest.makeSuite(TestApp))
    test_suite.addTest(unittest.makeSuite(TestIntegration))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    # Run the tests and exit with appropriate code
    success = run_tests()
    sys.exit(0 if success else 1)
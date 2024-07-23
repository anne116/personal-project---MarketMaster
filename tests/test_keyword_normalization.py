import unittest
from app import normalize_keyword

class TestNormalization(unittest.TestCase):

    def test_normalize_simple_text(self):
        text = " Camera"
        expected_result = "camera"
        self.assertEqual(normalize_keyword(text), expected_result)

    def test_normalize_text_with_special_characters(self):
        text = "vavjk;jkl"
        expected_result = None
        self.assertEqual(normalize_keyword(text), expected_result)

    def test_normalize_empty_text(self):
        text = ""
        expected_result = None
        self.assertEqual(normalize_keyword(text), expected_result)

if __name__ == "__main__":
    unittest.main()

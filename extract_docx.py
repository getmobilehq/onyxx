#!/usr/bin/env python3
import zipfile
import xml.etree.ElementTree as ET
import sys
import re

def extract_text_from_docx(docx_path):
    """Extract text from a docx file"""
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_file:
            # Read the main document
            with zip_file.open('word/document.xml') as doc_file:
                content = doc_file.read().decode('utf-8')
                
                # Parse XML and extract text
                root = ET.fromstring(content)
                
                # Find all text elements
                text_elements = []
                
                # Define namespace
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                
                # Extract all text nodes
                for text_elem in root.iter():
                    if text_elem.text and text_elem.text.strip():
                        text_elements.append(text_elem.text.strip())
                
                # Also try regex approach for backup
                text_matches = re.findall(r'<w:t[^>]*>(.*?)</w:t>', content)
                if text_matches:
                    text_elements.extend(text_matches)
                
                return '\n'.join(text_elements)
                
    except Exception as e:
        return f"Error extracting text: {str(e)}"

if __name__ == "__main__":
    docx_path = "/Users/josephagunbiade/Desktop/studio/onyx/Building_Cost.docx"
    extracted_text = extract_text_from_docx(docx_path)
    print(extracted_text)
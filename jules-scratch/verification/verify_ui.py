import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    Navigates to the built extension pages and takes screenshots for verification.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Get the absolute path to the project directory
        # The script is run from the root, but the files are in learning-snapshot/
        project_root = os.path.abspath('learning-snapshot')

        # --- Verify Popup Page ---
        popup_path = f'file://{os.path.join(project_root, "dist/src/popup/index.html")}'
        print(f"Navigating to popup page: {popup_path}")
        page.goto(popup_path)

        # Wait for the main heading to be visible to ensure the page is loaded
        expect(page.get_by_role("heading", name="Learning Snapshot")).to_be_visible()

        # Take a screenshot
        popup_screenshot_path = "jules-scratch/verification/popup_verification.png"
        page.screenshot(path=popup_screenshot_path)
        print(f"Popup screenshot saved to {popup_screenshot_path}")

        # --- Verify Options Page ---
        options_path = f'file://{os.path.join(project_root, "dist/src/options/index.html")}'
        print(f"Navigating to options page: {options_path}")
        page.goto(options_path)

        # Wait for the settings heading to be visible
        expect(page.get_by_role("heading", name="Settings")).to_be_visible()
        # Check for the OpenAI API Key label
        expect(page.get_by_label("OpenAI API Key")).to_be_visible()

        # Take a screenshot
        options_screenshot_path = "jules-scratch/verification/options_verification.png"
        page.screenshot(path=options_screenshot_path)
        print(f"Options screenshot saved to {options_screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_verification()
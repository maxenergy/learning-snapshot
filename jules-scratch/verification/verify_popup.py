import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    Launches the browser with extensive debugging listeners to capture
    any errors from the extension's service worker.
    """
    with sync_playwright() as p:
        extension_path = os.path.abspath('/app/minimal-test-ext')

        context = p.chromium.launch_persistent_context(
            '',
            headless=True,
            args=[
                f"--disable-extensions-except={extension_path}",
                f"--load-extension={extension_path}",
            ],
        )

        # --- DEBUGGING LISTENERS ---
        def handle_console(msg):
            # Print any console message from the extension that isn't just noise
            if 'playwright' not in msg.text.lower():
                print(f"BROWSER CONSOLE: {msg.type} >> {msg.text}")
        context.on("console", handle_console)

        def handle_page_error(err):
            print(f"BROWSER PAGE ERROR: {err.name} at {err.stack}")
        context.on("pageerror", handle_page_error)

        def handle_worker_error(worker):
            print(f"WORKER CRASHED: {worker.url}")
        context.on("worker", lambda w: w.on("crash", handle_worker_error))
        # --- END DEBUGGING LISTENERS ---

        try:
            print("Waiting for service worker...")
            # Give it a generous timeout to start
            service_worker = context.wait_for_event('serviceworker', timeout=10000)
            print(f"Service worker started successfully: {service_worker.url}")

            # If it succeeds, proceed with verification
            extension_id = service_worker.url.split('/')[2]
            popup_url = f"chrome-extension://{extension_id}/src/popup/index.html"
            page = context.new_page()
            page.goto(popup_url)

            print("Verifying popup content...")
            expect(page.get_by_role("heading", name="Learning Snapshot")).to_be_visible()
            screenshot_path = 'jules-scratch/verification/verification.png'
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"\n--- SCRIPT FAILED ---")
            print(f"ERROR: Could not start service worker or verify UI.")
            print(f"DETAILS: {e}")
            print("The console output above may contain the root cause.")
            print("---------------------\n")
            # Re-raise the exception to ensure the step fails
            raise e
        finally:
            context.close()

if __name__ == "__main__":
    run_verification()
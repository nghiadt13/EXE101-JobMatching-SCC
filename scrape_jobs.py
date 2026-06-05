import requests
from bs4 import BeautifulSoup
import json
import re

def scrape_careerviet():
    url = "https://careerviet.vn/viec-lam/kinh-doanh-ban-hang-c31-vi.html"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    print(f"Fetching {url}...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        jobs = []
        # Tùy thuộc vào HTML của careerviet, class thường là 'job-item'
        job_items = soup.find_all('div', class_='job-item')
        if not job_items:
            # Thu thập các thẻ a có thuộc tính class liên quan đến job
            job_items = soup.find_all('div', class_='figcaption')

        for item in job_items:
            title_tag = item.find('h2') or item.find('a', class_='job_link')
            company_tag = item.find('a', class_='company-name')
            location_tag = item.find('div', class_='location') or item.find('li', class_='location')

            title = title_tag.text.strip() if title_tag else "Unknown Title"
            company = company_tag.text.strip() if company_tag else "Unknown Company"
            location = location_tag.text.strip() if location_tag else "Unknown Location"

            if title != "Unknown Title":
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": location,
                    "domain": "Marketing/Economics"
                })

            if len(jobs) >= 50:
                break

        print(f"Found {len(jobs)} jobs.")
        with open("scraped_jobs.json", "w", encoding="utf-8") as f:
            json.dump(jobs, f, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scrape_careerviet()

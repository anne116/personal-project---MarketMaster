# MarketMaster

MarketMaster is a tool designed to assist potential Amazon sellers in analyzing market trends and making informed decisions about their product listings. This project provides essential features like product search, data crawling, and market analysis.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)

## Features

- **Product Search:** Allows users to search for products using specific keywords.
- **Data Crawling:** Crawls Amazon website for product data.
- **Market Analysis and Visualization:** Provides detailed market analysis including number of sellers, price range, average price, average rating, and reviews, as well as visualized analysis charts and suggested product sales titles.
- **User Management:** Users can create accounts, save searches, and manage their preferences.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/marketmaster.git
    ```
2. Navigate to the project directory:
    ```sh
    cd marketmaster
    ```
3. Install dependencies for the main application:
    ```sh
    pip install -r requirements.txt
    npm install
    ```
4. Install dependencies for the worker application:
    ```sh
    pip install -r requirements_worker.txt
    ```
5. Set up the database by importing the backup file:
    ```sh
    mysql -u root -p < dump20240715.sql
    ```
6. Run the main application:
    ```sh
    uvicorn app:app --reload
    ```
7. Run the worker application:
    ```sh
    xvfb-run -a python worker.py
    ```

## Usage

You can access the application at [https://annchenstudio.com](https://annchenstudio.com).

1. Open your browser and navigate to `https://annchenstudio.com`.
2. Use the search bar to input a product keyword.
3. View the search results and analysis on the respective pages.
4. Keywords example existing in database that you can try immediately:
    "accessory",
    "action figure",
    "Air Fryer",
    "air purifier",
    "Amazon fire TV stick",
    "ant killer",
    "anti slip dog paw pads",
    "Apple AirPods",
    "Apple AirTag",
    "bag",
    "bed sheet",
    "bicycle",
    "board game",
    "body lotion",
    "camera",
    "camping gear",
    "car part",
    "children's book",
    "crocs",
    "cushion foundation",
    "disposable face towel",
    "earring",
    "educational toy",
    "engagement gifts",
    "External Hard Drive",
    "fiction",
    "Fitbit",
    "fitness equipment",
    "fitness tracker",
    "flat back stud earrings",
    "fly trap",
    "furniture",
    "grooming product",
    "headphone",
    "health supplement",
    "home decor",
    "hydrating serum for face",
    "kitchen gadgets",
    "laptop",
    "laptops",
    "lego",
    "makeup",
    "makeup remover wipes",
    "mascara",
    "men's clothing",
    "microphone",
    "microwave",
    "monitor",
    "Nintendo Switch",
    "non-fiction",
    "personalized cutting board",
    "pet food",
    "pet toy",
    "pillow case",
    "ping pong paddle",
    "portable bluetooth speaker",
    "printer",
    "puzzle",
    "refrigerator",
    "skincare product",
    "smartphone",
    "smartphones",
    "smartwatch",
    "sports equipment",
    "SSD",
    "sun protection shirts",
    "tablet",
    "taiwanese oolong tea bags",
    "tazo decaffeinated chai tea bags",
    "tech golf polo",
    "tupperware organizer for pantry",
    "textbook",
    "vacuum cleaner",
    "washing machine",
    "water shoes",
    "Wireless Earbuds",
    "women's clothing",
    "snoopy cup",
    "snoopy shirt",
    "water bottle",
    "snoopy blanket",


## Technologies Used

- **Frontend:** React
- **Backend:** Python, FastAPI
- **Database:** AWS RDS (MySQL)
- **Crawling:** Python Playwright
- **Deployment:** Docker, AWS EC2
- **Others:** AWS SQS, AWS CloudFront, AWS S3, WebSockets for real-time notifications

## Architecture

![Architecture Diagram](./images/Architecture.png)

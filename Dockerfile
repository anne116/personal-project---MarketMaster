# Use an official python runtime as a parent image
FROM python:3.9-slim AS builder

WORKDIR /app

# Upgrade pip to the latest version
RUN pip install --upgrade pip

# Copy the requirement.txt before other files and install dependencies
COPY requirement.txt .

# Install any needed packages specified in requirement.txt
RUN pip install --no-cache-dir -r requirement.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy the current directory contents into the container at /app
COPY . .

# Second stage: minimal runtime image
FROM python:3.9-slim

WORKDIR /app

# Copy installed packages from the builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the application files from the builder stage to the final image
COPY --from=builder /app /app

# Set the environment variable for Playwright browsers path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install Playwright and browsers
RUN python -m playwright install

# Ensure Playwright browsers are available in the final image
RUN mkdir -p /root/.cache/ms-playwright

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Command to run when the container starts 
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]


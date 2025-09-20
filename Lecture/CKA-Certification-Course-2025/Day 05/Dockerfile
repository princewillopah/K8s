# Specifies the base image to use. Here, it is a lightweight Python 3.9 image.
FROM python:3.9-slim  

# Sets /app as the working directory, in the container, for subsequent instructions.
WORKDIR /app  

# Copies the app.py file from the host to the container.
COPY app.py app.py  

# Installs the Flask library required for the application.
RUN pip install flask  && apt update && apt install -y build-essential

# Expose the application port
EXPOSE 5000  

# Defines the default command to start the application.
#CMD ["python", "app.py"]

ENTRYPOINT [ "python" ]
CMD [ "app.py" ]
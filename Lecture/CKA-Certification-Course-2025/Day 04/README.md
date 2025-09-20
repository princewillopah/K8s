# Day 4: Docker Flags, Deep Dive into Dockerfile, and Exposing Containers | CKA Certification Course 2025

## Video reference for Day 4 is the following:

[![Watch the video](https://img.youtube.com/vi/34l1gRszQS4/maxresdefault.jpg)](https://youtu.be/34l1gRszQS4)

---
## ⭐ Support the Project  
If this **repository** helps you, give it a ⭐ to show your support and help others discover it! 

---


## **Specifying a Custom Dockerfile Name and Understanding the Build Command in Docker**

When working with Docker, the default name for a Dockerfile is **`Dockerfile`**. However, you can specify a custom name to suit different purposes (e.g., development vs. production environments). This flexibility allows better organization of your project while leveraging Docker's powerful build capabilities.

---

## **Why Use a Custom Name for Dockerfile?**

In certain cases, having multiple Dockerfiles is essential:
- **Environment-Specific Builds**: Use custom names like `Dockerfile.dev` for development and `Dockerfile.prod` for production.
- **Complex Projects**: When different services in your project need distinct Dockerfiles, custom names help keep everything structured.
- **Clarity**: Clearly named Dockerfiles make it easier for teams to understand the purpose of each file.

---

## **Building an Image with a Custom Dockerfile Name**

To build an image using a custom-named Dockerfile, use the `-f` flag in the `docker build` command.

### **Command Syntax**
```bash
docker build -t <image-name> -f <path-to-custom-dockerfile> <build-context>
```

### **Explanation of Flags**
- **`-t <image-name>`**: Assigns a name (or tag) to the built image.
- **`-f <path-to-custom-dockerfile>`**: Specifies the custom Dockerfile to use.
- **`<build-context>`**: The directory containing files required for the build. This includes the Dockerfile (if not specified with `-f`) and any other files referenced during the build.

---

## **Understanding the Build Context**

The **build context** is the directory Docker uses to locate files for the build process. All files inside this directory are sent to the Docker daemon, allowing Dockerfile instructions like `COPY` and `ADD` to access them.

### **Key Points About the Build Context**
- **Accessibility**: Files outside the build context cannot be accessed during the build.
- **Optimization**: Use a `.dockerignore` file to exclude unnecessary files from the build context, reducing the size of the transfer to the Docker daemon.

### **Example: Building with a Custom Build Context**
If the custom Dockerfile and build context are located in different directories:
```bash
docker build -t entry-image -f /path/to/custom-dockerfile /path/to/build-context
```
- The `-f` flag points to the Dockerfile's location.
- The build context is specified as `/path/to/build-context`.

---

## **CMD vs ENTRYPOINT**

While both `CMD` and `ENTRYPOINT` define what commands should run in a container, their purposes differ:

| **Aspect**              | **`CMD`**                                                                                             | **`ENTRYPOINT`**                                                                                  | **`RUN`**                                                                                          |
|--------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| **Purpose**             | Specifies the default command to execute when the container starts.                                   | Specifies the command that will always execute when the container starts (immutable part).        | Executes commands during the image build process.                                                  |
| **Execution Context**   | Runs when a container is started.                                                                    | Runs when a container is started.                                                                | Runs during the **image build** phase (at build time).                                              |
| **Default Behavior**    | Can be overridden by the user at runtime (`docker run <image> <command>`).                            | Cannot be fully overridden by the user unless `--entrypoint` is specified.                       | Used for preparing the image (e.g., installing dependencies, setting up the environment).          |
| **Command Type**        | Acts as the default "runtime" command for the container.                                              | Acts as the "always executed" entrypoint for the container.                                       | Executes commands to modify the image layers during build time.                                    |
| **Form Supported**      | Supports **shell form** and **exec form**.                                                           | Supports **exec form** only.                                                                      | Supports **shell form** and **exec form**.                                                         |
| **Overriding Behavior** | User can replace it entirely at runtime.                                                             | User can only append arguments to it at runtime (unless overridden explicitly with `--entrypoint`). | Once executed during image build, the result is baked into the image.                             |
| **Common Use Cases**    | Specify the default script or command to run, such as starting an app server.                        | Used for setting up an entry point (e.g., a wrapper script or command) that runs regardless of additional parameters. | Install dependencies, set up the environment, and make the image production-ready.                |
| **Example (Exec Form)** | `CMD ["python", "app.py"]`                                                                            | `ENTRYPOINT ["python", "app.py"]`                                                                | `RUN apt-get update && apt-get install -y python3`                                                 |
| **Example (Shell Form)**| `CMD python app.py`                                                                                   | Not supported.                                                                                    | `RUN apt-get update && apt-get install -y python3`                                                 |
| **Chaining with CMD**   | Only one `CMD` instruction is allowed per Dockerfile (the last one overrides previous ones).          | Can be combined with `CMD` to provide default arguments (e.g., `CMD ["arg1", "arg2"]`).           | Multiple `RUN` instructions are allowed, and each creates a new layer in the image.               |
| **When to Use**         | When you want a default command that users can override at runtime.                                   | When you want to ensure a specific command or script is always executed for the container.         | When you need to execute commands during the build phase to bake results into the image.           |

---

## **Common Docker Commands**

### **Container Management**
- **List all containers (including stopped ones)**: `docker ps -a`
- **Inspect container metadata**: `docker inspect <container_id>` or `docker inspect <image_id>`
- **List running processes in a container**: `docker top <container_id>`
- **Stop a specific container**: `docker stop <container_id>`
- **Start a stopped container**: `docker start <container_id>`
- **Stop all running containers**: `docker stop $(docker ps -q)`
- **Restart a container**: `docker restart <container_id>`
- **Delete a specific container**: `docker rm <container_id>`
- **Delete all stopped containers**: `docker container prune`

### **Image Management**
- **Dangling images**: Images that are no longer tagged or associated with any container.
- **Delete a specific image**: `docker rmi <image_id>`
- **Delete all unused images (including dangling images)**: `docker image prune -a`

---

### **Conclusion**
Understanding how to use custom-named Dockerfiles and the `docker build` command gives you greater flexibility in managing containerized applications. By mastering `CMD` and `ENTRYPOINT`, you'll better control container behavior, and by leveraging Docker commands effectively, you'll improve the efficiency of both development and deployment workflows. Keep exploring these concepts to build scalable, modular, and well-optimized Docker environments!

For further reading: [Docker Best Practices: Choosing Between RUN, CMD, and ENTRYPOINT](https://www.docker.com/blog/docker-best-practices-choosing-between-run-cmd-and-entrypoint/)

---
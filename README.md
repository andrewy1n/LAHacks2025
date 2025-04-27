# Project Story: RepoReLeaf 🌱💻

## About the Project 🚀

We were inspired by the hackathon track name — **"Clean Code"** — and the broader **Sustainable Web Design** movement 🌍.  
As developers, we believe that writing efficient, sustainable code can have a meaningful impact on our planet, and we wanted to create a tool that empowers developers to take action ✨.

**RepoReLeaf** analyzes your GitHub repositories, estimates the carbon footprint of your code 🌿, suggests direct changes to make it more sustainable, and even **pushes those improvements to a new branch** automatically 📂🌱.

Our stack:
- **Frontend**: React + Vite ⚡
- **Backend**: FastAPI + Gemini API (LLM) 🧠

We also developed a custom **GitHub App** 🛠️ that interacts with repositories, enabling seamless integration and automatic branch creation with sustainability-focused improvements.

---

## How the Algorithm for Code Generation Works 🛠️🧠

1. **Parse the Code**  
   We scan the repository code for **static heuristics**(file sizes, unused code, image formats, etc) that we find through our parsing script and estimate **dynamic properties** (DOM size, server response times, etc) using the Gemini LLM 🧩.

2. **Analyze and Find Problems**  
   Using sustainable web development practices 🌱, we prompt Gemini to analyze specific files and detect predefined problems (like inefficient image handling, unoptimized loops, etc.) 🕵️‍♂️.

3. **Generate Solutions**  
   For each identified problem in a file, we provide Gemini with instructions to **generate code improvements** targeted at fixing those issues 🔧📄.

4. **Push Changes**  
   Once the improved code is generated, we offer users the ability to **push the changes directly** to a **new branch** on their selected GitHub repository 🚀🌿.

---

## What We Learned 📚

Throughout the project, we learned:
- How to estimate digital emissions based on file storage and code complexity ⚡📦.
- Best practices for sustainable web development 🌎.
- How to leverage LLMs like Gemini for large-scale code analysis and generation 🤖.
- Building and integrating a GitHub App to automate code contributions 🔧.

---

## Challenges We Faced ⚔️

One major challenge was deciding **how to estimate emissions from repository code** 🤔.  
After research and discussion, we chose to follow the methodology outlined in [Sustainable Web Design's estimation guide](https://sustainablewebdesign.org/estimating-digital-emissions/#:~:text=0.081%20kWh/GB-,The%20final%20values,-we%20obtain%20for), using storage size and additional heuristics inspired by sustainable web development guidelines 📏.

Another challenge was working with **Gemini API for code generation** 🧩. Some of the larger reasoning tasks we needed — like suggesting holistic improvements for large files — were too slow to process in a single request 🐢.  
We had to rethink our approach and break tasks down into smaller, faster operations ⚡.

---

We hope **RepoReLeaf** helps developers make cleaner, greener code accessible to everyone — making **sustainability** a first-class citizen in the world of software development 🌍💚.

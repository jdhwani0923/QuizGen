let currentQuiz = null;

document.addEventListener("DOMContentLoaded", function () {

    const fileInput = document.getElementById("pdfFile");
    const fileNameText = document.getElementById("fileName");

    if (fileInput) {
        fileInput.addEventListener("change", function () {
            fileNameText.innerText = this.files.length > 0
                ? this.files[0].name
                : "No file selected";
        });
    }
});


// 🚀 GENERATE QUIZ
async function generateQuiz(button) {

    const topic = document.getElementById("topic").value;
    const description = document.getElementById("description").value;
    const difficulty = document.getElementById("difficulty").value;
    const questions = document.getElementById("questionCount")?.value || 25;
    const type = document.getElementById("type").value;

    const loader = document.getElementById("loader");
    const preview = document.getElementById("quizPreview");
    const fileInput = document.getElementById("pdfFile");

    let pdfText = "";

    try {
        // Button loading
        if (button) {
            button.disabled = true;
            button.innerText = "Generating...";
        }

        loader.classList.remove("hidden");
        preview.innerHTML = "";

        // 📄 PDF upload
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("pdf", fileInput.files[0]);

            const res = await fetch("/upload-pdf", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            pdfText = data.content || "";
        }

        // 🧠 Generate quiz
        const res = await fetch("/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                topic,
                description: description + "\n" + pdfText,
                difficulty,
                num_questions: parseInt(questions) || 25,
                type
            })
        });

        const data = await res.json();
        currentQuiz = data;

        renderQuiz(data);

    } catch (error) {
        console.error(error);
        alert("Something went wrong!");
    } finally {
        loader.classList.add("hidden");

        if (button) {
            button.disabled = false;
            button.innerText = "🚀 Generate Quiz";
        }
    }
}


// 🧾 RENDER QUIZ + BUTTONS (MAIN FIX)
function renderQuiz(data) {

    const preview = document.getElementById("quizPreview");

    let html = `<h2>${data.title}</h2>`;

    data.questions.forEach((q, i) => {

        html += `<div class="question">
            <b>${i + 1}. ${q.question}</b>`;

        if (q.options && q.options.length > 0) {
            q.options.forEach(o => {
                html += `<p>${o}</p>`;
            });
        }

        html += `<details>
                    <summary>Show Answer</summary>
                    ${q.answer}
                 </details>`;

        html += `</div>`;
    });

    // ✅ BUTTONS ALWAYS AFTER OUTPUT
    html += `
    <div class="action-buttons">
    <button class="action-btn pdf" onclick="downloadPDF()">📄 Download PDF</button>
    <button class="action-btn copy" onclick="copyQuiz()">📋 Copy</button>
    <button class="action-btn form" onclick="exportToGoogleForm()">📊 Google Form</button>
    </div>
    `;
    preview.innerHTML = html;
}


// 📄 DOWNLOAD PDF (FIXED)
async function downloadPDF() {

    if (!currentQuiz) {
        alert("Generate quiz first!");
        return;
    }

    try {
        const res = await fetch("/download-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentQuiz)
        });

        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "quiz.pdf";

        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (err) {
        console.error(err);
        alert("PDF download failed");
    }
}


// 📋 COPY QUIZ (FIXED)
function copyQuiz() {

    if (!currentQuiz) {
        alert("Generate quiz first!");
        return;
    }

    let text = "";

    currentQuiz.questions.forEach((q, i) => {
        text += `${i + 1}. ${q.question}\n`;

        if (q.options) {
            q.options.forEach(o => text += o + "\n");
        }

        text += `Answer: ${q.answer}\n\n`;
    });

    
}


// 🌐 GOOGLE FORM EXPORT (CONNECTED TO YOUR BACKEND)
async function exportToGoogleForm() {

    if (!currentQuiz) {
        alert("Generate quiz first!");
        return;
    }

    // ✅ open tab immediately (avoids popup block)
    const newTab = window.open("", "_blank");

    try {
        const res = await fetch("/export-google-form", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(currentQuiz)
        });

        const data = await res.json();

        if (data.url) {
            newTab.location.href = data.url; // ✅ loads form
        } else {
            newTab.close();
            alert("Form creation failed");
        }

    } catch (err) {
        newTab.close();
        alert("Error creating form");
    }
}
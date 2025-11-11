document.addEventListener("DOMContentLoaded", () => {
    const navList = document.getElementById("nav-list");
    const contentArea = document.getElementById("content");
    const refreshBtn = document.getElementById("refresh-btn");

    async function loadJSON() {
        try {
            const response = await fetch("conn.php"); //NOTE: Swap to part5.php once we get PHP/SQL portions done
            const data = await response.json();
            displayNavigation(data.Websys_course);
        } catch (err) {
            console.error("Error fetching JSON:", err);
            navList.innerHTML = "<li id='error'>Could not summon data from the abyss...</li>";
        }
    }

    function displayNavigation(courseData) {
        navList.innerHTML = "";

        const lectureHeader = document.createElement("h3");
        lectureHeader.textContent = "Lectures";
        navList.appendChild(lectureHeader);

        Object.entries(courseData.Lectures).forEach(([key, lecture]) => {
            const item = document.createElement("li");
            item.textContent = lecture.Title;
            item.addEventListener("click", () =>
                displayContent(lecture.Title, lecture.Description)
            );
            navList.appendChild(item);
        });

        const labHeader = document.createElement("h3");
        labHeader.textContent = "Labs";
        navList.appendChild(labHeader);

        Object.entries(courseData.Labs).forEach(([key, lab]) => {
            const item = document.createElement("li");
            item.textContent = lab.Title;
            item.addEventListener("click", () =>
                displayContent(lab.Title, lab.Description)
            );
            navList.appendChild(item);
        });
    }

    function displayContent(title, description) {
        contentArea.innerHTML = `
            <h2>${title}</h2>
            <p>${description}</p>
            <img src="spooky.jpg" alt="spooky footer" class="spooky">
        `;
    }

    refreshBtn.addEventListener("click", loadJSON);

    loadJSON();
});

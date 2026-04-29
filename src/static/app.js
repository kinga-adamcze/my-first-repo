document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and repopulate activity dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = details.participants.map(p => `
          <li>
            <span class="participant-email">${p}</span>
            <span class="confirm-inline hidden">
              Are you sure you want to unassign from classes?
              <button class="confirm-icon" type="button" title="Confirm unassign">✅</button>
              <button class="cancel-icon" type="button" title="Cancel unassign">❌</button>
            </span>
            <button class="delete-btn" type="button" data-activity="${name}" data-email="${p}" title="Unassign participant">🗑</button>
          </li>
        `).join('');

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants (${details.participants.length}/${details.max_participants}):</strong>
            <ul class="participants-list">
              ${participantsList || '<li class="no-participants">No participants yet</li>'}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add delete event listeners
        const deleteButtons = activityCard.querySelectorAll(".delete-btn");
        deleteButtons.forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const listItem = btn.closest("li");
            const emailSpan = listItem.querySelector(".participant-email");
            const confirmInline = listItem.querySelector(".confirm-inline");

            emailSpan.classList.add("hidden");
            btn.classList.add("hidden");
            confirmInline.classList.remove("hidden");
          });
        });

        const confirmButtons = activityCard.querySelectorAll(".confirm-icon");
        confirmButtons.forEach(confirmBtn => {
          confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const listItem = confirmBtn.closest("li");
            const deleteBtn = listItem.querySelector(".delete-btn");
            const email = deleteBtn.getAttribute("data-email");
            const activity = deleteBtn.getAttribute("data-activity");

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              if (response.ok) {
                fetchActivities();
              } else {
                const result = await response.json();
                alert(result.detail || "Failed to unassign");
              }
            } catch (error) {
              console.error("Error unregistering:", error);
              alert("Failed to unassign. Please try again.");
            }
          });
        });

        const cancelButtons = activityCard.querySelectorAll(".cancel-icon");
        cancelButtons.forEach(cancelBtn => {
          cancelBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const listItem = cancelBtn.closest("li");
            const emailSpan = listItem.querySelector(".participant-email");
            const deleteBtn = listItem.querySelector(".delete-btn");
            const confirmInline = listItem.querySelector(".confirm-inline");

            confirmInline.classList.add("hidden");
            emailSpan.classList.remove("hidden");
            deleteBtn.classList.remove("hidden");
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

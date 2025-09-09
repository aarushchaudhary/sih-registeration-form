document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const errorMessageEl = document.getElementById('error-message');
    const memberFormsContainer = document.getElementById('member-forms-container');
    const memberTemplate = document.getElementById('member-form-template');

    // --- NEW: Get leader input fields ---
    const leaderNameInput = document.getElementById('teamLeaderName');
    const leaderPhoneInput = document.getElementById('teamLeaderPhone');

    const courseData = {
        'B.Tech Computer Engineering': ['1st', '2nd', '3rd', '4th'],
        'B. Tech. Computer Science and Engineering (Data Science)': ['1st', '2nd', '3rd', '4th']
    };

    const generateMemberForms = (teamSize) => {
        memberFormsContainer.innerHTML = ''; 
        for (let i = 1; i <= teamSize; i++) {
            const formClone = memberTemplate.content.cloneNode(true);
            
            const title = formClone.querySelector('.member-title');
            if (title) {
                title.textContent = `Member ${i} Details`;
            }

            const courseSelect = formClone.querySelector('.course-select');
            if (courseSelect) {
                populateCourseDropdown(courseSelect);
                courseSelect.addEventListener('change', (event) => {
                    const selectedCourse = event.target.value;
                    const memberSection = event.target.closest('.member-section');
                    populateYearDropdown(selectedCourse, memberSection);
                });
            }
            
            memberFormsContainer.appendChild(formClone);
        }
        // --- NEW: After forms are created, set up the auto-fill ---
        setupLeaderDataSync();
    };

    // --- NEW: Function to sync leader data to the first member form ---
    const setupLeaderDataSync = () => {
        const firstMemberNameInput = memberFormsContainer.querySelector('input[name="name"]');
        const firstMemberPhoneInput = memberFormsContainer.querySelector('input[name="phone"]');

        if (leaderNameInput && firstMemberNameInput) {
            leaderNameInput.addEventListener('input', () => {
                firstMemberNameInput.value = leaderNameInput.value;
            });
        }

        if (leaderPhoneInput && firstMemberPhoneInput) {
            leaderPhoneInput.addEventListener('input', () => {
                firstMemberPhoneInput.value = leaderPhoneInput.value;
            });
        }
    };

    const populateCourseDropdown = (courseSelect) => {
        if (!courseSelect) return;
        
        Object.keys(courseData).forEach(course => {
            courseSelect.innerHTML += `<option value="${course}">${course}</option>`;
        });
    };

    const populateYearDropdown = (course, memberSection) => {
        if (!memberSection) return;
        const yearSelect = memberSection.querySelector('.year-select');

        if (!yearSelect) return;

        yearSelect.innerHTML = '<option value="">-- Select a Year --</option>';

        if (course && courseData[course]) {
            const years = courseData[course];
            years.forEach(year => {
                yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
            });
        }
    };

    const initializeForm = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            const teamSize = data.membersPerTeam || 0; 
            if (teamSize > 0 && memberTemplate.content.children.length > 0) {
                 generateMemberForms(teamSize);
            }
        } catch (error) {
            console.error('Failed to load team settings.', error);
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        errorMessageEl.textContent = '';
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';

        const formData = new FormData(form);
        const teamData = {
            teamName: formData.get('teamName'),
            teamLeaderName: formData.get('teamLeaderName'),
            teamLeaderPhone: formData.get('teamLeaderPhone'),
            sihProblemStatementId: formData.get('sihProblemStatementId'),
            sihProblemStatement: formData.get('sihProblemStatement'),
            category: formData.get('category'),
            members: []
        };

        const memberSections = document.querySelectorAll('.member-section');
        memberSections.forEach(section => {
            const member = {
                name: section.querySelector('input[name="name"]').value,
                sapId: section.querySelector('input[name="sapId"]').value,
                course: section.querySelector('select[name="course"]').value,
                year: section.querySelector('select[name="year"]').value,
                email: section.querySelector('input[name="email"]').value,
                phone: section.querySelector('input[name="phone"]').value,
            };
            teamData.members.push(member);
        });

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed.');
            }

            document.getElementById('registration-view').style.display = 'none';
            document.getElementById('success-view').style.display = 'block';

        } catch (error) {
            errorMessageEl.textContent = error.message;
            submitButton.disabled = false;
            submitButton.textContent = 'Register Team';
        }
    });
    
    initializeForm();
});
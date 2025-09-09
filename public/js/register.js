document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const errorMessageEl = document.getElementById('error-message');
    const memberFormsContainer = document.getElementById('member-forms-container');
    const memberTemplate = document.getElementById('member-form-template');

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
        setupLeaderDataSync();
    };

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

        const teamData = {
            teamName: form.teamName.value,
            teamLeaderName: form.teamLeaderName.value,
            teamLeaderPhone: form.teamLeaderPhone.value,
            sihProblemStatementId: form.sihProblemStatementId.value,
            sihProblemStatement: form.sihProblemStatement.value,
            category: form.category.value,
            members: []
        };

        const memberSections = document.querySelectorAll('.member-section');
        memberSections.forEach(section => {
            const member = {
                name: section.querySelector('input[name="name"]').value,
                sapId: section.querySelector('input[name="sapId"]').value,
                course: section.querySelector('select[name="course"]').value,
                year: section.querySelector('select[name="year"]').value,
                semester: section.querySelector('select[name="semester"]').value,
                gender: section.querySelector('select[name="gender"]').value,
                email: section.querySelector('input[name="email"]').value,
                phone: section.querySelector('input[name="phone"]').value,
            };
            teamData.members.push(member);
        });

        const hasGirl = teamData.members.some(member => member.gender === 'Girl');
        if (!hasGirl) {
            errorMessageEl.textContent = 'The team must include at least one girl.';
            submitButton.disabled = false;
            submitButton.textContent = 'Register Team';
            return;
        }

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
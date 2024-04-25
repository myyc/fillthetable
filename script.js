document.addEventListener('DOMContentLoaded', function () {
    // Assuming the periodic table is structured in rows and columns
    const GRID_COLUMNS = 18; // Adjust based on your periodic table layout

    const periodicTable = document.getElementById('periodic-table');
    const modal = document.getElementById('element-modal');
    const elementNameInput = document.getElementById('element-name');
    let currentElement; // Keep track of the current element being guessed
    let elementsArray = []; // Store element names for autocompletion
    const autocompleteList = document.getElementById('autocomplete-list');

    elementNameInput.addEventListener('input', function () {
        updateAutocomplete(this.value);
    });

    fetch('elements.json')
        .then(response => response.json())
        .then(elementsData => {
            elementsData.forEach(element => {
                const elementDiv = document.createElement('div');
                elementDiv.classList.add('element');
                elementDiv.setAttribute('tabindex', '0'); // Make each element focusable
                elementDiv.dataset.index = (element.ypos - 1) * GRID_COLUMNS + element.xpos; // Grid position
                elementDiv.dataset.xpos = element.xpos;
                elementDiv.dataset.ypos = element.ypos;
                elementDiv.dataset.name = element.name.toLowerCase(); // Store the name for case insensitive comparison
                elementDiv.dataset.symbol = element.symbol; // Store the symbol for displaying
                elementDiv.dataset.category = element.category.replace(/ /g, '-').toLowerCase(); // Store the category for styling
                elementDiv.setAttribute('tabindex', '0');

                elementDiv.textContent = element.number; // Display atomic number
                elementDiv.style.gridRowStart = element.ypos;
                elementDiv.style.gridColumnStart = element.xpos;
                elementsArray.push(element.name.toLowerCase()); // Add element name to autocompletion array

                // Attach click event to each element box
                elementDiv.addEventListener('click', function () {
                    currentElement = this; // Set the current element
                    interactWithElement(this); // Open the modal
                });

                periodicTable.appendChild(elementDiv);
            });
            document.querySelector('.element[tabindex="0"]').focus();
        })
        .catch(error => {
            console.error('Error loading the elements data:', error);
        });

    elementNameInput.addEventListener('input', function () {
        updateAutocomplete(this.value);
    });

    // Add event listener to the container that holds the autocomplete items
    autocompleteList.addEventListener('click', function (event) {
        const target = event.target;
        if (target.className === 'autocomplete-item') {
            const element = target.textContent;
            elementNameInput.value = element; // Set the input field to the text of the clicked item
            autocompleteList.innerHTML = ''; // Clear the autocomplete list
            autocompleteList.style.display = 'none'; // Hide the autocomplete list

            processGuess(element); // Call the function to process the guess with the clicked item's text
        }
    });

    function updateAutocomplete(input) {
        autocompleteList.innerHTML = ''; // Clear existing entries
        if (input.trim() === '') {
            autocompleteList.style.display = 'none'; // Hide the list if input is empty
            return;
        }

        const filteredSuggestions = elementsArray.filter(name => name.toLowerCase().startsWith(input.toLowerCase())).slice(0, 5);
        if (filteredSuggestions.length > 0) {
            filteredSuggestions.forEach(function (element) {
                const div = document.createElement('div');
                div.textContent = element;
                div.classList.add('autocomplete-item');
                autocompleteList.appendChild(div);
            });
            autocompleteList.style.display = 'block';
        } else {
            autocompleteList.style.display = 'none';
        }
    }

    function processGuess(guessedName) {
        const isCorrect = guessedName === currentElement.dataset.name;

        const autocompleteList = document.getElementById('autocomplete-list');

        // Clear autocomplete suggestions
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none'; // Hide the autocomplete list


        if (isCorrect) {
            currentElement.classList.add('guessed', currentElement.dataset.category);
            currentElement.textContent = currentElement.dataset.symbol;
            modal.style.display = 'none';
            elementNameInput.value = '';
            currentElement.focus(); // Refocus on the guessed element
        } else {
            displayError();
        }
    }



    document.addEventListener('keydown', function (event) {
        const activeElement = document.activeElement;

        if (activeElement.id === 'element-name') {
            // Context: Input field is active
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission
                const suggestions = autocompleteList.getElementsByTagName('div');
                if (suggestions.length > 0) {
                    // If there are autocomplete suggestions, select the first one
                    elementNameInput.value = suggestions[0].textContent; // Update input value
                    processGuess(suggestions[0].textContent.toLowerCase()); // Process the guess
                } else {
                    // No suggestions, so process the input as a regular guess
                    processGuess(elementNameInput.value.trim().toLowerCase());
                }
            }
        } else if (activeElement.classList.contains('element')) {
            // Context: An element in the periodic table is focused
            switch (event.key) {
                case "ArrowRight":
                    moveFocus(activeElement, 1); // Move right
                    break;
                case "ArrowLeft":
                    moveFocus(activeElement, -1); // Move left
                    break;
                case "ArrowDown":
                    moveFocus(activeElement, GRID_COLUMNS); // Move down a row
                    break;
                case "ArrowUp":
                    moveFocus(activeElement, -GRID_COLUMNS); // Move up a row
                    break;
                case "Enter":
                    interactWithElement(activeElement); // Use the same function when Enter is pressed
                    break;
            }
        }
    });

    function interactWithElement(element) {
        if (!element.classList.contains('guessed')) {
            modal.style.display = 'flex';  // Show the modal
            elementNameInput.focus();  // Focus on the input field in the modal
            currentElement = element;  // Set the currentElement to this element for processing guesses
        }
    }

    function moveFocus(currentElement, delta) {
        const elements = Array.from(document.querySelectorAll('.element[tabindex="0"]'));
        const currentIndex = elements.indexOf(currentElement);
        let targetIndex = currentIndex;

        if (delta === 1 || delta === -1) { // Left or Right
            targetIndex = currentIndex + delta;
        } else {
            // Up or Down
            targetIndex = findVerticalTargetIndex(elements, currentIndex, delta);
        }

        if (targetIndex >= 0 && targetIndex < elements.length) {
            elements[targetIndex].focus();
        }
    }

    function findVerticalTargetIndex(elements, currentIndex, delta) {
        let currentElement = elements[currentIndex];
        let currentX = parseInt(currentElement.dataset.xpos);
        let currentY = parseInt(currentElement.dataset.ypos);
        let targetY = currentY + Math.sign(delta); // target row after moving up or down

        // Handle special jumps between main group and rare earths
        if (currentY === 6 && targetY === 7) { // Jumping from row 6 to rare earths
            targetY = 9; // jump to the first row of rare earths
        } else if (currentY === 9 && targetY === 8) { // Jumping back from rare earths to main group
            targetY = 6;
        }

        // Find the next element that matches the target X and the new target Y
        return elements.findIndex(el => parseInt(el.dataset.xpos) === currentX && parseInt(el.dataset.ypos) === targetY);
    }

    function displayError() {
        const errorOverlay = document.getElementById('error-overlay');

        // Display the error overlay
        errorOverlay.style.display = 'flex';

        // Hide the error overlay after 0.5 seconds
        setTimeout(() => {
            errorOverlay.style.display = 'none'; // Hide the overlay
            elementNameInput.value = ''; // Clear the input field
            elementNameInput.focus(); // Refocus to input for a new try
        }, 500);
    }

    // Initially, the modal is hidden
    modal.style.display = 'none';

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target !== elementNameInput) {
            autocompleteList.style.display = 'none';
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { // Check if the pressed key is Escape
            if (modal.style.display === 'flex') {
                modal.style.display = 'none'; // Close the modal
                currentElement.focus(); // Refocus on the element
            }
        }
    });

    function updateAutocomplete(input) {
        autocompleteList.innerHTML = ''; // Clear previous suggestions
        if (input.trim() === '') {
            return; // Exit if input is empty
        }

        const filteredSuggestions = elementsArray.filter(name => name.toLowerCase().startsWith(input.toLowerCase())).slice(0, 5);
        if (filteredSuggestions.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }

        filteredSuggestions.forEach(function (element) {
            const div = document.createElement('div');
            div.textContent = element; // Set the text content to the element name
            div.classList.add('autocomplete-item'); // Optional: add a class for styling
            div.addEventListener('click', function () {
                elementNameInput.value = element; // Set input value to the clicked suggestion
                autocompleteList.innerHTML = ''; // Clear suggestions after selection
                autocompleteList.style.display = 'none'; // Hide list after selection
            });
            autocompleteList.appendChild(div); // Append each suggestion to the autocomplete list
        });

        autocompleteList.style.display = 'block'; // Make sure to display the list
    }

    document.querySelectorAll('.element').forEach(element => {
        element.addEventListener('click', function () {
            interactWithElement(this);  // Pass the clicked element to the function
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const background = document.getElementById('background');
    const plant = document.getElementById('draggable-plant');
    const submitBtn = document.getElementById('submit-btn');
    const resultMessage = document.getElementById('result-message'); // Get result message div
  
    // Exit if essential elements aren't found
    if (!background || !plant || !submitBtn || !resultMessage) {
        console.error("Quiz elements not found!");
        return; 
    }
    
    // Get the correct zone from the data attribute
    const correctZone = background.dataset.correctZone;
    let placement = null; // Store the user's placement { plant, zone }
    let isSubmitting = false; // Flag to prevent double submissions

    plant.addEventListener('dragstart', e => {
        // Set drag data (optional, could just use plant.dataset.plant later)
        try {
            e.dataTransfer.setData('plant-id', plant.dataset.plant);
            e.dataTransfer.effectAllowed = 'move';
        } catch (error) {
            console.warn("Could not set drag data:", error); // Might fail in some browsers/modes
        }
        plant.classList.add('opacity-50'); // Indicate dragging
    });

    plant.addEventListener('dragend', () => {
        plant.classList.remove('opacity-50'); // Restore appearance
    });
  
    background.addEventListener('dragover', e => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move'; 
    });
  
    background.addEventListener('drop', e => {
        e.preventDefault();
        if (!plant) return; // Make sure plant element exists
  
        const rect = background.getBoundingClientRect();
        // Calculate drop position relative to the background container
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Move the image visually where it was dropped
        plant.style.position = 'absolute';
        // Constrain position within bounds slightly
        plant.style.left = Math.max(0, Math.min(x, rect.width)) + 'px';
        plant.style.top = Math.max(0, Math.min(y, rect.height)) + 'px'; 
        plant.style.transform = 'translate(-50%, -50%)'; // Center on cursor
        plant.style.zIndex = '10';

        // Check if the plant is already appended to background, if not, append it.
        // This handles dropping it back onto the background after dragging it out.
        if (plant.parentElement !== background) {
             background.appendChild(plant);
        }
       
        submitBtn.disabled = false; // Enable submit button
        resultMessage.innerHTML = '&nbsp;'; // Clear previous result message
        resultMessage.className = 'mt-4 text-lg font-bold'; // Reset classes
        background.classList.remove('border-green-500', 'border-red-500', 'border-dashed', 'border-gray-300');
        background.classList.add('border-solid', 'border-duo-blue'); // Indicate ready to submit

        // Determine lighting zone based on drop location (4 quadrants)
        const width = background.offsetWidth;
        const height = background.offsetHeight;
    
        let droppedZone = '';
        if (x < width / 2 && y < height / 2) droppedZone = 'bright-indirect';
        else if (x >= width / 2 && y < height / 2) droppedZone = 'low-medium';
        else if (x < width / 2 && y >= height / 2) droppedZone = 'moderate-indirect';
        else droppedZone = 'bright-filtered';
    
        placement = {
            plant: plant.dataset.plant,
            zone: droppedZone
        };
        console.log("Placed in zone:", droppedZone, "Correct zone:", correctZone); // Debug log
    });
  
    submitBtn.addEventListener('click', () => {
        if (!placement || isSubmitting) return; // Exit if no placement or already submitting
        
        isSubmitting = true; // Set flag
        submitBtn.disabled = true; // Disable button during feedback/submit
        
        const isCorrect = placement.zone === correctZone;

        // --- Instant Feedback Logic --- 
        if (isCorrect) {
            resultMessage.textContent = 'Correct! 🎉';
            resultMessage.classList.add('text-duo-green');
            background.classList.remove('border-duo-blue', 'border-red-500');
            background.classList.add('border-green-500');
        } else {
            resultMessage.textContent = 'Not quite... 🤔';
            resultMessage.classList.add('text-red-500');
            background.classList.remove('border-duo-blue', 'border-green-500');
            background.classList.add('border-red-500');
        }
        background.classList.remove('border-solid'); // Maybe keep solid border?
        background.classList.add('border-solid'); // Ensure border is solid for feedback

        // Wait briefly, then submit to server and navigate
        setTimeout(() => {
            fetch('/submit-plant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(placement) // Send the recorded placement
            })
            .then(res => {
                if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }
                return res.json();
            })
            .then(data => {
                if (data.next_url) {
                    window.location.href = data.next_url; // Navigate to next question/results
                }
            })
            .catch(error => {
                console.error('Error submitting placement:', error);
                resultMessage.textContent = 'Error submitting. Please try again.';
                resultMessage.className = 'mt-4 text-lg font-bold text-red-500';
                isSubmitting = false; // Reset flag on error
                submitBtn.disabled = false; // Re-enable button on error
            });
        }, 1500); // Wait 1.5 seconds before proceeding
    });
});
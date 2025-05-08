// Wait for the DOM to be ready
$(document).ready(function() {
    // Select elements using jQuery
    const $dropZone = $('#room-image-dropzone'); // <<< Target the image
    const $dropContainer = $('#background-container'); // <<< Container div
    const $plant = $('#draggable-plant');
    const $submitBtn = $('#submit-btn');
    const $resultMessage = $('#result-message');
    const $plantBox = $('#plant-box'); // Original container for the plant

    // Exit if essential elements aren't found
    if (!$dropZone.length || !$dropContainer.length || !$plant.length || !$submitBtn.length || !$resultMessage.length) {
        console.error("Quiz elements not found!");
        return; 
    }
    
    // Get the correct zone from the data attribute ON THE IMAGE
    const correctZone = $dropZone.data('correct-zone');
    let placement = null; // Store the user's placement { plant, zone }
    let isSubmitting = false; // Flag to prevent double submissions

    // Timer functionality
    let startTime = Date.now();
    let timerInterval;

    function updateTimer() {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        $('#timer').text(`Time: ${elapsedTime}s`);
    }

    // Start the timer when the page loads
    timerInterval = setInterval(updateTimer, 1000);

    // Make plant draggable (using HTML5 draggable attribute)
    // Add visual feedback on drag start/end
    $plant.on('dragstart', function(e) {
        // jQuery event object doesn't directly expose dataTransfer easily for setting data.
        // We rely on the HTML draggable='true' attribute.
        // If needed, access originalEvent: e.originalEvent.dataTransfer.setData(...)
        $(this).addClass('dragging'); // Add custom class for visual feedback
    });

    $plant.on('dragend', function() {
        $(this).removeClass('dragging'); // Remove visual feedback class
    });
  
    // --- Drop Zone Event Handlers (Attached to the IMAGE) --- 
    $dropZone.on({
        dragover: function(e) {
            e.preventDefault(); // Necessary to allow dropping
            // Optional: Add a class to indicate droppable area
            // $(this).addClass('drag-over'); 
        },
        dragleave: function(e) {
            // Optional: Remove droppable area class
            // $(this).removeClass('drag-over');
        },
        drop: function(e) {
            e.preventDefault();
            // $(this).removeClass('drag-over');

            const droppedPlant = $('.dragging'); // Find the element being dragged
            if (!droppedPlant.length) return; 
            
            const bgOffset = $(this).offset(); 
            const dropX = e.pageX - bgOffset.left;
            const dropY = e.pageY - bgOffset.top;
            const bgWidth = $(this).width();
            const bgHeight = $(this).height();

            // Move the image visually where it was dropped
            // Append to the CONTAINER, but position based on IMAGE drop coordinates
            droppedPlant.css({
                position: 'absolute',
                left: Math.max(0, Math.min(dropX, bgWidth)) + 'px',
                top: Math.max(0, Math.min(dropY, bgHeight)) + 'px',
                // Explicitly set width and height, maintain aspect ratio
                height: '80px', 
                width: '80px',   
                objectFit: 'contain', // Ensure image fits within the 80x80 box
                transform: 'translate(-50%, -50%)', // Center on cursor
                zIndex: 10, // Ensure it's above the background image (z-index: 1)
                border: '2px solid var(--duo-white)', // Add a border to make it pop
                borderRadius: '50%' // Make it circular maybe?
            }).appendTo($dropContainer); // <<< Append to the CONTAINER
            
            $submitBtn.prop('disabled', false); // Enable submit button
            $resultMessage.addClass('d-none').removeClass('alert-success alert-danger').text(''); // Reset result message
            // Add ready-to-submit class to the CONTAINER for the border effect
            $dropContainer.removeClass('correct incorrect').addClass('ready-to-submit'); 

            // Define zones based on the light patterns in the original image
            let droppedZone = '';
            
            // Calculate relative position (0-1 range)
            const relativeX = dropX / bgWidth;
            const relativeY = dropY / bgHeight;
            
            if (relativeX < 0.33 && relativeY < 0.33) {
                droppedZone = 'bright-indirect';  // Top-left section
            } else if (relativeX >= 0.33 && relativeX < 0.66 && relativeY < 0.33) {
                droppedZone = 'bright-indirect';  // Top-middle section
            } else if (relativeX >= 0.66 && relativeY < 0.33) {
                droppedZone = 'bright-indirect';  // Top-right section
            } else if (relativeX < 0.33 && relativeY >= 0.33 && relativeY < 0.66) {
                droppedZone = 'direct-bright';    // Middle-left section
            } else if (relativeX >= 0.33 && relativeX < 0.66 && relativeY >= 0.33 && relativeY < 0.66) {
                droppedZone = 'direct-bright';    // Middle-middle section
            } else if (relativeX >= 0.66 && relativeY >= 0.33 && relativeY < 0.66) {
                droppedZone = 'low-medium';       // Middle-right section
            } else if (relativeX < 0.33 && relativeY >= 0.66 && relativeY < 0.825) {
                droppedZone = 'direct-bright';    // Bottom-left-top section
            } else if (relativeX < 0.33 && relativeY >= 0.825) {
                droppedZone = 'bright-indirect';  // Bottom-left-bottom section
            } else if (relativeX >= 0.33 && relativeX < 0.66 && relativeY >= 0.66 && relativeY < 0.825) {
                droppedZone = 'direct-bright';    // Bottom-middle-top section
            } else if (relativeX >= 0.33 && relativeX < 0.66 && relativeY >= 0.825) {
                droppedZone = 'bright-indirect';  // Bottom-middle-bottom section
            } else if (relativeX >= 0.66 && relativeY >= 0.66) {
                droppedZone = 'low-medium';       // Bottom-right section
            }
            
            placement = {
                plant: droppedPlant.data('plant'),
                zone: droppedZone
            };
            
            // Enhanced logging
            console.log("Drop Details:", {
                position: { x: relativeX, y: relativeY },
                imageSize: { width: bgWidth, height: bgHeight },
                detectedZone: droppedZone,
                correctZone: correctZone
            });
        } 
    });
    
    // --- Submit Button Click Handler --- 
    $submitBtn.on('click', function() {
        if (!placement || isSubmitting) return; 
        
        isSubmitting = true; 
        $submitBtn.prop('disabled', true); 
        
        const isCorrect = placement.zone === correctZone;
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Add/remove classes on the CONTAINER for border effect
        $dropContainer.removeClass('ready-to-submit').addClass(isCorrect ? 'correct' : 'incorrect');

        // Show feedback message using Bootstrap Alert classes
        $resultMessage
            .text(isCorrect ? 'Correct! 🎉' : 'Not quite... 🤔')
            .removeClass('d-none alert-success alert-danger') 
            .addClass(isCorrect ? 'alert-success' : 'alert-danger'); 

        // Wait briefly, then submit to server and navigate
        setTimeout(() => {
            // Use jQuery AJAX or keep fetch
            $.ajax({
                url: '/submit-plant',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    plant: placement.plant,
                    zone: placement.zone,
                    time_spent: timeSpent
                }),
                dataType: 'json',
                success: function(data) {
                    if (data.next_url) {
                        window.location.href = data.next_url; 
                    } else if (data.error) {
                        console.error('Server error:', data.error);
                        $resultMessage
                            .text('Error submitting. Please try again.')
                            .removeClass('d-none alert-success')
                            .addClass('alert-danger');
                        isSubmitting = false; 
                        $submitBtn.prop('disabled', false); 
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('Error submitting placement:', textStatus, errorThrown);
                    $resultMessage
                        .text('Error submitting. Please try again.')
                        .removeClass('d-none alert-success')
                        .addClass('alert-danger');
                    isSubmitting = false; 
                    $submitBtn.prop('disabled', false); 
                }
            });
        }, 1500); // Wait 1.5 seconds 

        // Store the time when submitting the answer
        const questionTimes = JSON.parse(localStorage.getItem('questionTimes') || '[]');
        questionTimes.push({
            question: parseInt($('#timer').data('question-num')),
            time: timeSpent
        });
        localStorage.setItem('questionTimes', JSON.stringify(questionTimes));
        clearInterval(timerInterval);
    });

    // Results page functionality
    if ($('#question-times').length) {
        const questionTimes = JSON.parse(localStorage.getItem('questionTimes') || '[]');
        let totalTime = 0;

        // Sort times by question number
        questionTimes.sort((a, b) => a.question - b.question);

        questionTimes.forEach((item, index) => {
            const listItem = $('<div>')
                .addClass('list-group-item d-flex justify-content-between align-items-center')
                .html(`
                    <span>Question ${item.question}</span>
                    <span class="badge bg-info rounded-pill">${item.time} seconds</span>
                `);
            $('#question-times').append(listItem);
            totalTime += item.time;
        });

        // Format total time
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = minutes > 0 
            ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
            : `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        $('#total-time').text(timeString);
        
        // Clear the stored times after displaying them
        localStorage.removeItem('questionTimes');
    }
});
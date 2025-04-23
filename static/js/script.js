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

            // Determine lighting zone based on drop location (relative to IMAGE)
            let droppedZone = '';
            if (dropX < bgWidth / 2 && dropY < bgHeight / 2) droppedZone = 'bright-indirect';
            else if (dropX >= bgWidth / 2 && dropY < bgHeight / 2) droppedZone = 'low-medium';
            else if (dropX < bgWidth / 2 && dropY >= bgHeight / 2) droppedZone = 'moderate-indirect';
            else droppedZone = 'bright-filtered';
        
            placement = {
                plant: droppedPlant.data('plant'), // Get plant id from dragged element
                zone: droppedZone
            };
            console.log("Placed in zone:", droppedZone, "Correct zone:", correctZone);
        } 
    });
    
    // --- Submit Button Click Handler --- 
    $submitBtn.on('click', function() {
        if (!placement || isSubmitting) return; 
        
        isSubmitting = true; 
        $submitBtn.prop('disabled', true); 
        
        const isCorrect = placement.zone === correctZone;

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
                data: JSON.stringify(placement),
                dataType: 'json',
                success: function(data) {
                    if (data.next_url) {
                        window.location.href = data.next_url; 
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
    });
});
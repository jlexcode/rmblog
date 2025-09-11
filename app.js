// Random letter resolution effect
function randomLetterEffect(text, element, duration = 3000) {
    // Clear initial blur from CSS since we're doing character-by-character
    element.style.filter = 'blur(0px)';
    element.style.opacity = '1';
    element.style.transition = 'none';
    
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const targetText = text;
    const totalSteps = Math.floor(duration / 50); // Update every 50ms
    let currentStep = 0;
    
    // Track which letters have been "solved"
    const solvedLetters = new Array(targetText.length).fill(false);
    const currentDisplay = new Array(targetText.length).fill('');
    
    function updateStep() {
        if (currentStep < totalSteps) {
            let allSolved = true;
            
            for (let i = 0; i < targetText.length; i++) {
                if (targetText[i] === ' ') {
                    // Spaces are always "solved"
                    currentDisplay[i] = ' ';
                    solvedLetters[i] = true;
                } else if (!solvedLetters[i]) {
                    // Calculate probability of solving this letter based on progress
                    const progressFactor = currentStep / totalSteps;
                    const positionFactor = (i + 1) / targetText.length;
                    
                    // Letters solve roughly left to right, but with some randomness
                    const solveProbability = Math.max(0, progressFactor - positionFactor * 0.3 + Math.random() * 0.2);
                    
                    if (solveProbability > 0.6) {
                        // Letter is solved!
                        currentDisplay[i] = targetText[i];
                        solvedLetters[i] = true;
                    } else {
                        // Show random character
                        currentDisplay[i] = characters[Math.floor(Math.random() * characters.length)];
                        allSolved = false;
                    }
                } else {
                    // Keep the solved letter
                    allSolved = allSolved && true;
                }
            }
            
            element.innerHTML = currentDisplay.join('');
            
            if (allSolved) {
                // All letters solved, ensure final text is correct
                element.innerHTML = targetText;
                return;
            }
            
            currentStep++;
            setTimeout(updateStep, 50);
        } else {
            // Time's up, show final text
            element.innerHTML = targetText;
        }
    }
    
    updateStep();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('title-text');
    
    // Check if user has seen the animation this session
    const hasSeenAnimation = sessionStorage.getItem('hasSeenAnimation');
    
    if (!hasSeenAnimation) {
        // First visit this session - show random letter resolution effect
        randomLetterEffect('Reasonable Machines', titleElement, 3000);
        sessionStorage.setItem('hasSeenAnimation', 'true');
    } else {
        // Return visit - show text immediately
        titleElement.textContent = 'Reasonable Machines';
    }
})
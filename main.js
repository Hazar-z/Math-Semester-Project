
//JS function for Math-Project Game using Reveal.js



//Method to animate visual effect
		Reveal.addEventListener('slidechanged', function (event) {
			console.log("Fragment shown!", event.fragment);  //debug
			const currentSlide = event.currentSlide;
			const boxes = currentSlide.querySelectorAll('.circle-draw');
			boxes.forEach(box => {
			//Reset animation
			box.style.animation = 'none';
			box.style.opacity = '0';
			void box.offsetWidth;

//Read custom delay from data-delaty attribute
			const delay = parseInt(box.getAttribute('data-delay')) ||100;

			 setTimeout(() => {
                box.style.animation = 'drawboxframe 1s ease-out forwards';
            }, delay);
        });
		});

//function that play "tap-sound" when clicking a button and then forwards the user to the targetSlideIndex
        function playTapAndGo(slideIndex, soundId = 'tap-sound') {
            const sound = document.getElementById(soundId);
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.warn("Sound failed:", e));
            }

            setTimeout(() => {
                Reveal.slide(slideIndex);
            }, 300);
        }
/*******************************************************************/
// ******* GAME SECTION FUNCTIONS ********
/*******************************************************************/

// Function that binds 'data-go' buttons to their next target slide
// Function that binds 'data-go' buttons to their next target slide
function bindContinueButtons() {
	document.querySelectorAll('[data-go]').forEach(btn => {
		btn.onclick = () => {
			const nextId = btn.getAttribute('data-go');
			if (!nextId) return;

			const nextSlide = document.querySelector(`[data-question-id="${nextId}"]`);
			if (nextSlide) Reveal.slide(nextSlide);
			else console.warn("Next question not found:", nextId);
		};
	});
} 


// Function that binds 'data-go' buttons to their next target slide
function bindContinueButtons() {
	document.querySelectorAll('[data-go]').forEach(btn => {
		btn.onclick = () => {
			const nextId = btn.getAttribute('data-go');
			if (!nextId) return;

			const nextSlide = document.querySelector(`[data-question-id="${nextId}"]`);
			if (nextSlide) Reveal.slide(nextSlide);
			else console.warn("Next question not found:", nextId);
		};
	});
}

// Function to bind answer buttons and move vertically to feedback
function bindAnswerButtons() {
	document.querySelectorAll('.answer').forEach(btn => {
		btn.addEventListener('click', () => {
			const feedbackId = btn.getAttribute('data-feedback');
			const feedbackSlide = document.getElementById(feedbackId);
			if (!feedbackSlide) return;

			const parentStack = feedbackSlide.closest('section');
			const hIndex = Array.from(document.querySelectorAll('section.question-group')).indexOf(parentStack);
			const vIndex = Array.from(parentStack.children).indexOf(feedbackSlide);

			// Play correct/wrong sound
			const isCorrect = btn.getAttribute('data-correct') === 'true';
			const sound = document.getElementById(isCorrect ? 'correct-sound' : 'wrong-sound');
			if (sound) {
				sound.currentTime = 0;
				sound.play().catch(e => console.warn("Audio error:", e));
			}

			// Navigate
			setTimeout(() => {
				Reveal.slide(hIndex, vIndex);
			}, 300);
		});
	});
}

// Shuffle function for question slides only
function shuffleQuestions() {
	const slidesContainer = document.querySelector('.reveal .slides');
	const questionGroups = Array.from(document.querySelectorAll('section.question-group'));

	// Remove all question groups from DOM
	questionGroups.forEach(group => slidesContainer.removeChild(group));

	// Shuffle the question groups
	for (let i = questionGroups.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[questionGroups[i], questionGroups[j]] = [questionGroups[j], questionGroups[i]];
	}

	// Re-append shuffled question groups
	questionGroups.forEach(group => slidesContainer.appendChild(group));

	// Update data-go attributes
	const questionIds = questionGroups.map(group => group.querySelector('.question-slide')?.getAttribute('data-question-id'));
	questionIds.forEach((id, index) => {
		const nextId = questionIds[index + 1];
		document.querySelectorAll(`[data-go="${id}"]`).forEach(el => {
			if (nextId) el.setAttribute('data-go', nextId);
			else el.removeAttribute('data-go');
		});
	});

	// Re-bind buttons
	bindContinueButtons();
	bindAnswerButtons();
}




/*******************************************************************/
// ******* GENERAL FUNCTION FOR MAINTANING THE WHOLE PRESENTATION *********
/*******************************************************************/

//Blocking nav-buttons from display on first slide:
		function updateNavVisibility() {
			 const nav = document.getElementById('nav-buttons');  //pause+nav arrows
			 const timer = document.getElementById('game-timer');  //timer
			 const current = Reveal.getIndices();
			 if (current.h === 0) {
				 nav.classList.add('hidden');
				 timer.classList.add('hidden');
			}	
			 else {
				 nav.classList.remove('hidden');// Show on others
				 timer.classList.remove('hidden'); // Show on others
				  
			 }
		}

// trigger this every time the slide changes
		 Reveal.addEventListener('slidechanged', updateNavVisibility);

// also trigger it once when the presentation starts
		 Reveal.addEventListener('ready', updateNavVisibility);


//Navigation arrows functions that are customized to skip answer-feedbacks:
function goToSlideSkippingFeedback(direction) {
	const totalSlides = Reveal.getTotalSlides();
	let index = Reveal.getIndices().h;

	let step = direction === 'forward' ? 1 : -1;

	for (let i = index + step; i >= 0 && i < totalSlides; i += step) {
		let slide = Reveal.getSlides()[i];
		if (!slide || slide.dataset.role !== 'feedback') {
			Reveal.slide(i);
			break;
		}
	}
}

function goNext() {
	goToSlideSkippingFeedback('forward');
}

function goPrev() {
	goToSlideSkippingFeedback('backward');
}

//Time calculating and Display methods:
		let gameTimerInterval = null;
		let elapsedSeconds = 0;
		let gameStarted = false; // To ensure it runs only once

// Start timer (run this once at the start of your game)
		function startGameTimer() {
			if (gameTimerInterval || gameStarted ) return; // Prevent multiple intervals!
			 
		  gameStarted = true;

		  gameTimerInterval = setInterval(() => {
		   if (!isPaused) {
			  elapsedSeconds++;
			  updateTimerDisplay();
			 }
			}, 1000); // Count up every second
		}
//Function to display time in MM:SS version
		function updateTimerDisplay() {
			 const minutes = Math.floor(elapsedSeconds / 60);     // Get full minutes
			 const seconds = elapsedSeconds % 60;                 // Remaining seconds

		// Format as "MM:SS" with leading zeros if needed
			document.getElementById('game-timer').textContent =
		    String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
		}

//function to toggle pause buttn: Called by pause button
		let isPaused = false;
		function togglePause() {
			 isPaused = !isPaused;
			 console.log(isPaused ? '⏸️ Game paused' : '▶️ Game resumed');

			const pauseBtn= document.getElementById('pause-btn');
			if(isPaused) {
				pauseBtn.classList.add('playing');  //switch to play icon ▶️
			}
			else{
				pauseBtn.classList.remove('playing');  //switch back to pause icon ⏸️
			}
		}
	
//Listen for loading the presentation
		Reveal.on('ready', (event) => {
			const slideId = event.currentSlide.id;
			 if (slideId === 'start-game') {
				 showGameUI();
				 startGameTimer();
				 gameStarted= true;   //toggle flag to true so we know it's activated
			 }
			 else{
				 hideGameUI();
			 }
			});

//Listen for slide changing
		Reveal.on('slidechanged', (event) => {
			const slideId = event.currentSlide.id;
			if (slideId === 'start-game') {
			   //if the game hasn’t already started-->gameStarted=false. we still haven't landed on 'start-game' slide
				if (!gameStarted) {
				 showGameUI();
				 startGameTimer();
				 gameStarted= true;
	    	 }
		   }
			//the game already started--> gameStarted=true
			 else if (gameStarted) {
				 showGameUI(); // keep showing after 'start-game' slide
			 }
		    else {
			 hideGameUI(); //hide before 'start-game' slide
		    }
		});
		// Utility functions:
		 // Show pause and timer
	   	 function showGameUI(){
			const timer= document.getElementById('game-timer');
		    const pause= document.querySelector('.pause-button');
				timer.style.display= 'block';
				pause.style.display= 'block';

			// Delay to allow the elements to render before fading
			 setTimeout(() => {
				  timer.style.opacity = '1';
				  pause.style.opacity = '1'; }, 50); // Tiny delay

			// Start timer after fade-in is complete (1s later)
			setTimeout(() => {
			     startGameTimer();  }, 1000);
		 }
			

		 // Hide pause buttn adn timer 
		 function hideGameUI(){
			const timer= document.getElementById('game-timer');
			const pause= document.querySelector('.pause-button');
					timer.style.display= 'none';
					pause.style.display= 'none';
		 }

 //function that activate for ' data-correct="true" ': and plays sound accordingly: 
		 document.querySelectorAll('.answer').forEach(btn=> {
			 btn.addEventListener('click', () => {
				 const isCorrect = btn.getAttribute('data-correct') === "true";
				 const feedbackID =btn.getAttribute('data-feedback'); //target slide ID according to the feedback type
				
				//play sound according to the answer:
				 if(isCorrect) {
					 document.getElementById('correct-sound').play();
				 }
				 else {
					 document.getElementById('wrong-sound').play();
				 }
			   // Navigate to the slide after short delay (let the sound start)
				setTimeout(() => {
					Reveal.slide(targetSlide);
				}, 100); // delay

			   // Find slide by ID and navigate to it
				 const targetSlide = document.querySelector(`section#${feedbackID}`);
				 if (targetSlide) {
					 const indices = Reveal.getIndices(targetSlide);
					 setTimeout(() => {
						 Reveal.slide(indices.h, indices.v || 0); }, 100); // delay to let sound begin
				 }
				 else {
					 console.warn("⚠️ Slide with ID not found:", feedbackId);
				 }
			 });
		 });


// Shuffle only once when the DOM is ready (before Reveal.initialize)
//  Shuffle only once after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	shuffleQuestions();
});
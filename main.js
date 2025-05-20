
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
function bindContinueButtons() {
	document.querySelectorAll('.continue-to-next').forEach(btn => {
		btn.addEventListener('click', () => {
			const hIndex = parseInt(btn.getAttribute('data-go-h'));
			if (!isNaN(hIndex)) {
				console.log("➡️ Jumping to h:", hIndex);
				Reveal.slide(hIndex, 0);
			}
		});
	});
}




// Function to bind answer buttons and move vertically to feedback
function bindAnswerButtons() {
	document.querySelectorAll('.answer').forEach(btn => {
		btn.addEventListener('click', () => {
			const feedbackId = btn.getAttribute('data-feedback');
			const feedbackSlide = document.getElementById(feedbackId);
			if (!feedbackSlide) return;

			const indices = Reveal.getIndices(feedbackSlide);
			const hIndex = indices.h;
			const vIndex = indices.v;

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

	// Remove groups from DOM
	questionGroups.forEach(group => slidesContainer.removeChild(group));

	// Shuffle
	for (let i = questionGroups.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[questionGroups[i], questionGroups[j]] = [questionGroups[j], questionGroups[i]];
	}

	// Re-append
	questionGroups.forEach(group => slidesContainer.appendChild(group));

	// After shuffle, update continue buttons
	const groups = document.querySelectorAll('section.question-group');
	groups.forEach((group, i) => {
		const questionId = group.querySelector('.question-slide')?.getAttribute('data-question-id');
		const nextGroup = groups[i + 1];
		const nextId = nextGroup?.querySelector('.question-slide')?.getAttribute('data-question-id');

		const buttons = group.querySelectorAll('.continue-to-next');
		buttons.forEach(btn => {
			if (nextId) {
				btn.setAttribute('data-go', nextId);
			} else {
				btn.removeAttribute('data-go');
				btn.innerText = "סיימת!";
				btn.style.cursor = "default";
			}
		});
	});

	updateContinueButtons();  // ✅ add this!
	bindContinueButtons();    // ✅ re-binds after setting data
	bindAnswerButtons();      // ✅ already there
}

function updateContinueButtons() {
	const groups = Array.from(document.querySelectorAll('section.question-group'));
	const slides = Reveal.getHorizontalSlides();

	groups.forEach((group, i) => {
		const nextGroup = groups[i + 1];
		const buttons = group.querySelectorAll('.continue-to-next');

		if (!nextGroup) {
			// Last question
			buttons.forEach(btn => {
				btn.removeAttribute('data-go-h');
				btn.innerText = "סיימת!";
				btn.style.cursor = "default";
			});
			return;
		}

		// Find real horizontal index of the next group
		const hIndex = Array.from(slides).indexOf(nextGroup);

		buttons.forEach(btn => {
			btn.setAttribute('data-go-h', hIndex);
		});
	});
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
document.querySelectorAll('.answer').forEach(btn => {
	btn.addEventListener('click', () => {
		const isCorrect = btn.getAttribute('data-correct') === "true";
		const feedbackID = btn.getAttribute('data-feedback'); // target feedback ID

		// play sound
		const sound = document.getElementById(isCorrect ? 'correct-sound' : 'wrong-sound');
		if (sound) {
			sound.currentTime = 0;
			sound.play().catch(err => console.warn("Audio failed:", err));
		}

		// find slide by ID
		const targetSlide = document.querySelector(`section#${feedbackID}`);
		if (targetSlide) {
			const indices = Reveal.getIndices(targetSlide);

			// fallback in case indices not found properly
			const h = indices?.h ?? 0;
			const v = indices?.v ?? 0;

			setTimeout(() => {
				console.log("Navigating to h:", h, "v:", v);
				Reveal.slide(h, v);
			}, 300); // delay to let sound play
		} else {
			console.warn("⚠️ Slide with ID not found:", feedbackID);
		}
	});
});


// Shuffle only once when the DOM is ready (before Reveal.initialize)
Reveal.on('ready', () => {
	shuffleQuestions();        // now DOM is fully there
});

window.addEventListener('click', (e) => {
	if (e.target.classList.contains('continue-to-next')) {
		alert("✅ Button clicked!");

		const nextId = e.target.getAttribute('data-go');
		console.log("Next question ID is:", nextId);
	}
});
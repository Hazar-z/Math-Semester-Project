
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
			const tapSound = document.getElementById('tap-sound');
			if (tapSound) tapSound.play();

			const hIndex = parseInt(btn.getAttribute('data-go-h'));
			if (!isNaN(hIndex)) {
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
			}, 200);
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
				btn.style.cursor = "default";
			}
		});
	});

	updateContinueButtons();  //  update continue buttons after shuffling
	bindContinueButtons();    //  re-binds after setting data
	bindAnswerButtons();      // rebind answer after setting data
}

function updateContinueButtons() {
	const groups = Array.from(document.querySelectorAll('section.question-group'));
	const slides = Reveal.getHorizontalSlides();

	groups.forEach((group, i) => {
		const nextGroup = groups[i + 1];
		const hIndex = nextGroup ? Array.from(slides).indexOf(nextGroup) : null;

		const feedbackSlides = group.querySelectorAll('[data-role="feedback"]');

		feedbackSlides.forEach(slide => {
			// Remove old buttons if they exist
			slide.querySelector('.continue-to-next')?.remove();
			slide.querySelector('.end-options')?.remove();

			const wrapper = document.createElement('div');
			wrapper.className = 'end-options';

			if (nextGroup) {
				// Regular "Click to Continue" button
				const continueBtn = document.createElement('a');
				continueBtn.className = 'continue-to-next';
				continueBtn.textContent = 'לחץ כאן כדי להמשיך';
				continueBtn.setAttribute('data-go-h', hIndex);

				wrapper.appendChild(continueBtn);
			}
			//change the the "click to continue" on final question so it won't bug
			else {
				// Final slide → add Replay and Tutorial buttons
				const btnReplay = document.createElement('a');
				btnReplay.id = 'btn-replay';
				btnReplay.textContent = 'שחק שוב 🔁 ';

				const btnTutorial = document.createElement('a');
				btnTutorial.id = 'btn-tutorial';
				btnTutorial.textContent = 'חזרה להדרכה 🏠';

				wrapper.appendChild(btnReplay);
				wrapper.appendChild(btnTutorial);
			}

			slide.appendChild(wrapper);
		});
	});
}

// poof sound when hovering over actions on game section:
document.addEventListener('mouseenter', (e) => {
	const target = e.target.closest('.continue-to-next, #btn-replay, #btn-tutorial');
	if (target) {
		//  Play poof sound
		const poofSound = document.getElementById('poof-sound');
		if (poofSound) {
			poofSound.currentTime = 0;
			poofSound.play().catch(() => { });
		}

		//  Star dust effect
		for (let i = 0; i < 7; i++) {
			const star = document.createElement('div');
			star.className = 'star-dust';

			// Random position inside the button
			const x = Math.random() * target.offsetWidth;
			const y = Math.random() * target.offsetHeight;

			star.style.left = `${x}px`;
			star.style.top = `${y}px`;

			target.appendChild(star);
			setTimeout(() => star.remove(), 800);
		}
	}
}, true); 





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
//go next but skip the feedback slides when using navigation arrows:
function goNext() {
	goToSlideSkippingFeedback('forward');
}

//go prev but skip the feedback slides when using navigation arrows:
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


//Reset timer method- when replayin:
function resetGameState() {
	const allGroups = document.querySelectorAll('section.question-group');
	allGroups.forEach((group, hIndex) => {
		Reveal.slide(hIndex, 0); // ensure you're not stuck in feedback slide
	});
}

function resetGameTimer() {
	clearInterval(gameTimerInterval);
	gameTimerInterval = null;
	elapsedSeconds = 0;
	gameStarted = false;
	updateTimerDisplay();
}

//function to toggle pause buttn: Called by pause button
		let isPaused = false;
		function togglePause() {
			 isPaused = !isPaused;
			 console.log(isPaused ? ' Game paused' : 'Game resumed');  //debug

			const pauseBtn= document.getElementById('pause-btn');
			if(isPaused) {
				pauseBtn.classList.add('playing');  //switch to play icon 
			}
			else{
				pauseBtn.classList.remove('playing');  //switch back to pause icon 
			}
		}
	
// Handle game UI when presentation loads
Reveal.on('ready', (event) => {
	handleGameUIVisibility(event.currentSlide);
});

// Handle game UI every time the slide changes
Reveal.on('slidechanged', (event) => {
	handleGameUIVisibility(event.currentSlide);
});

// Unified logic for showing/hiding UI and starting timer
function handleGameUIVisibility(currentSlide) {
	const slideId = currentSlide?.id;
	const isGameSlide = slideId === 'start-game' || currentSlide?.classList.contains('question-slide');

	if (isGameSlide) {
		showGameUI();
		startGameTimer(); // will auto-block if already started
		gameStarted = true;
	} else {
		hideGameUI();
	}
}

// Show pause and timer with fade-in
function showGameUI() {
	const timer = document.getElementById('game-timer');
	const pause = document.querySelector('.pause-button');
	if (!timer || !pause) return;

	timer.style.display = 'block';
	pause.style.display = 'block';

	setTimeout(() => {
		timer.style.opacity = '1';
		pause.style.opacity = '1';
	}, 50);
}

// Hide pause and timer completely
function hideGameUI() {
	const timer = document.getElementById('game-timer');
	const pause = document.querySelector('.pause-button');
	if (!timer || !pause) return;

	timer.style.display = 'none';
	pause.style.display = 'none';
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
			}, 50); // delay to let sound play
		} else {
			console.warn(" slide with ID not found:", feedbackID);
		}
	});
});


// Shuffle only once when the DOM is ready (before Reveal.initialize)
Reveal.on('ready', () => {
	shuffleQuestions();        // now DOM is fully there
});

window.addEventListener('click', (e) => {
	if (e.target.classList.contains('continue-to-next')) {
		const nextId = e.target.getAttribute('data-go');
		console.log("Next question ID is:", nextId);  //debug
	}
});

//function lisetens for a click and check whether to play tap-sound audio for "replay" and "go to home page" buttns
document.addEventListener('click', (e) => {
	if (e.target?.id === 'btn-replay') {
		const tapSound = document.getElementById('tap-sound');
		if (tapSound) tapSound.play();

		resetGameState();
		resetGameTimer();
		shuffleQuestions();

		setTimeout(() => {
			const startSlide = document.getElementById('start-game');
			const hIndex = Array.from(Reveal.getHorizontalSlides()).indexOf(startSlide);
			if (hIndex !== -1) Reveal.slide(hIndex, 0);
		}, 0);
	}

	if (e.target?.id === 'btn-tutorial') {
		const tapSound = document.getElementById('tap-sound');
		if (tapSound) tapSound.play();

		resetGameState();
		resetGameTimer();
		shuffleQuestions();

		setTimeout(() => {
			Reveal.slide(0, 0);
		}, 0);
	}
});



//need to check if to keep this!
Reveal.on('slidechanged', (event) => {
	const current = event.currentSlide;
	if (current.classList.contains('question-slide')) {
		current.classList.add('fade-in');
		setTimeout(() => current.classList.remove('fade-in'), 700); // Reset
	}
});

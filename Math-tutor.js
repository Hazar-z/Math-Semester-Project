
//JS function for Math-Project Game using Reveal.js
let allowSound = true;
let correctStreak = 0;  //variable for streak points (3 or mores corrects answwers in row)
let musicPlaying = false;
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
let lastVolume = 0.3; // Default volume to restore on unmute
let correctGameAnswers = 0; //global variable to count correct answers in the game
let currentLanguage = 'heb'; // Default language



//detect when the slide becomes visible and trigger animation with delay
Reveal.addEventListener('slidechanged', (event) => {
	const slide = event.currentSlide;

	// Handle both .delayed-p and .animated-arrow
	slide.querySelectorAll('.delayed-p, .animated-arrow').forEach((el) => {
		el.classList.remove('visible-now'); // Reset in case of revisiting
		const delay = el.style.animationDelay || '0s';

		// Trigger animation after the specified delay
		setTimeout(() => {
			el.classList.add('visible-now');
		}, parseFloat(delay) * 1000);
	});
});

function toggleLanguageMenu() {
	const menu = document.getElementById('language-menu');
	menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'block' : 'none';
}

function switchLanguage(toLang) {
	currentLanguage = toLang;
	// Hide all language elements
	document.querySelectorAll('.lang').forEach(el => el.style.display = 'none');
	document.querySelectorAll(`.lang-${toLang}`).forEach(el => el.style.display = 'block');

	// Update active button style
	document.getElementById('btn-heb')?.classList.remove('active');
	document.getElementById('btn-ar')?.classList.remove('active');
	const btn = document.getElementById('btn-' + toLang);
	if (btn) btn.classList.add('active');

	// Stop any playing videos when switching language
	document.querySelectorAll('video').forEach(video => {
		video.pause();
		video.currentTime = 0; // optional: reset to start
	});
}



function playInstructionSimple(id) {
	const audio = document.getElementById(id);
	if (!audio) return;

	// Read file extension from HTML attribute
	const ext = audio.getAttribute("data-ext") || "mp3"; // fallback to mp3
	const path = `Math-Project/audio-instrcts-${currentLanguage}/${id}.${ext}`;

	audio.src = path;
	audio.play().catch(() => {
		console.warn(`Audio not found: ${path}`);
	});
}








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

// 🔊 PLAY SOUNDS when animations start
function attachSoundListeners(currentSlide) {
	const soundMap = {
		'peek-effect': {
			soundId: 'peek-sound',
			animationName: 'fade-in'
		},
		'animated-arrow': {
			soundId: 'arrow-sound',
			animationName: 'showThenHide'
		},
		'question-mark-bounce': {
			soundId: 'questionMark-sound',
			animationName: 'fade-in'
		},
		'click-to-continue': {
			soundId: 'continue-sound',
			animationName: 'fade-in'
		}
	};

	Object.keys(soundMap).forEach(className => {
		currentSlide.querySelectorAll(`.${className}`).forEach(el => {
			const handler = (e) => {
				if (e.animationName === soundMap[className].animationName) {
					const sound = document.getElementById(soundMap[className].soundId);
					if (sound) {
						sound.currentTime = 0;
						sound.play().catch(() => { });
					}
				}
			};
			el._soundHandler = handler;
			el.addEventListener('animationstart', handler);
		});
	});
}



// ❌ STOP all sound and remove listeners
function detachSoundListeners(slide) {
	slide.querySelectorAll('*').forEach(el => {
		if (el._soundHandler) {
			el.removeEventListener('animationstart', el._soundHandler);
		}
	});
}


// ✅ ON FIRST LOAD
document.addEventListener('DOMContentLoaded', () => {
	const current = Reveal.getCurrentSlide();
	if (current) {
		attachSoundListeners(current);
	}
});


// 🔁 WHEN SLIDE CHANGES
Reveal.on('slidechanged', (event) => {
	document.querySelectorAll('audio').forEach(audio => {
		// ✅ Skip pausing the background music
		if (audio.id !== 'bg-music') {
			audio.pause();
			audio.currentTime = 0;
		}
	});

	// Clean up old listeners from previous slide
	if (event.previousSlide) {
		detachSoundListeners(event.previousSlide);
	}

	// Attach new listeners only for current slide
	if (event.currentSlide) {
		attachSoundListeners(event.currentSlide);
	}

	// 🔁 Animate circle-draw boxes
	const boxes = event.currentSlide.querySelectorAll('.circle-draw');
	boxes.forEach(box => {
		box.style.animation = 'none';
		box.style.opacity = '0';
		void box.offsetWidth;

		const delay = parseInt(box.getAttribute('data-delay')) || 100;
		console.log('Activating box:', box.id, 'with delay:', delay); //debug
		setTimeout(() => {
			box.style.animation = 'drawboxframe 1s ease-out forwards';
		}, delay);
	});
});








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

			// 🔊 Play feedback sound immediately and fully bypass allowSound
			const isCorrect = btn.getAttribute('data-correct') === 'true';
			const sound = document.getElementById(isCorrect ? 'correct-sound' : 'wrong-sound');

			if (sound) {
				sound.pause();             // stop if it was already playing
				sound.currentTime = 0;     // rewind to start
				void sound.play().catch(err => {
					console.warn("Feedback sound failed to play:", err);
				});
			}
			// ✅ Handle Points & Streaks
			// ✅ Only count points and streaks in game section
			const isGameQuestion = btn.closest('.question-group') !== null;

			if (isCorrect && isGameQuestion) {
				addPoints(10); // Base points
				correctStreak++;
				correctGameAnswers++;  // Count correct game answers

				if (correctStreak >2 ) {
					addPoints(25); // Bonus
					showStreakPopup(25);
					playAudio('streak-sound');
				}
			} else if (!isCorrect && isGameQuestion) {
				correctStreak = 0; // ❌ Wrong in game = reset streak
			}




			// 🕒 Delay navigation slightly so sound gets committed
			setTimeout(() => {
				Reveal.slide(hIndex, vIndex);
			}, 1000); // 
		});
	});
}
//helper function to reset points:
function resetPoints() {
	totalPoints = 0;
	document.getElementById('points-count').textContent = '0';
}


//helper function for STREAK POINTS:
function showStreakPopup(bonus) {
	const popup = document.getElementById('points-popup');
	popup.innerHTML = `
		<span class="lang lang-heb">🔥 רצף!<br><span style="color: cadetblue;">+${bonus}</span></span>
		<span class="lang lang-ar" style="display: none;">🔥 تتالي!<br><span style="color: cadetblue;">+${bonus}</span></span>
	`;

	popup.style.opacity = '1';
	popup.style.transform = 'translateX(-100px) translateY(-25px) scale(1.1)';

	// ✅ Reapply current language properly
	switchLanguage(currentLanguage);

	setTimeout(() => {
		popup.style.opacity = '0';
		popup.style.transform = 'translateY(0) scale(1)';
	}, 3000);
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

	// After shuffle, update continue buttons
	updateContinueButtons();
	bindContinueButtons();
	bindAnswerButtons();

	// Reset all data-start attributes
	const allQuestions = document.querySelectorAll('.question-slide');
	allQuestions.forEach(q => q.removeAttribute('data-start'));


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
				continueBtn.innerHTML = `
						<span class="lang lang-heb">לחץ כאן כדי להמשיך</span>
						<span class="lang lang-ar" style="display:none;">اضغط هنا للمتابعة</span> `;

				continueBtn.setAttribute('data-go-h', hIndex);

				wrapper.appendChild(continueBtn);
			}
			//change the the "click to continue" on final question so it won't bug
			else {
				// Final feedback → link to static result slide
				const btnToResult = document.createElement('a');
				btnToResult.className = 'continue-to-next';
				btnToResult.innerHTML = `
	<span class="lang lang-heb">סיום וצפייה בתוצאה 💎</span>
	<span class="lang lang-ar" style="display:none;">💎 إنهاء وعرض النتيجة</span> `;



				// Find horizontal index of result slide
				const slides = Reveal.getHorizontalSlides();
				const finalResultSlide = document.getElementById('game-results');
				const finalH = Array.from(slides).indexOf(finalResultSlide);
				if (finalH !== -1) {
					btnToResult.setAttribute('data-go-h', finalH);
				}

				wrapper.appendChild(btnToResult);
			}




			slide.appendChild(wrapper);
		});
	});
}





// Poof sound and star dust effect on hover:
document.addEventListener('mouseenter', (e) => {
	// Make sure it's a valid Element
	if (!(e.target instanceof Element)) return;

	const target = e.target.closest('.continue-to-next, #btn-replay, #btn-tutorial, .hover-sound, .answer, .continue-button, .composition-next, .special-button');
	if (target) {
		// Play poof sound
		const poofSound = document.getElementById('poof-sound');
		if (poofSound) {
			poofSound.currentTime = 0;
			poofSound.play().catch(() => { });
		}

		// Star dust effect
		for (let i = 0; i < 7; i++) {
			const star = document.createElement('div');
			star.className = 'star-dust';

			const x = Math.random() * target.offsetWidth;
			const y = Math.random() * target.offsetHeight;

			star.style.left = `${x}px`;
			star.style.top = `${y}px`;

			target.appendChild(star);
			setTimeout(() => star.remove(), 800);
		}
	}
}, true);


let totalPoints = 0;

// Function to show +X points animation
function showPointsPopup(pts) {
	const popup = document.getElementById('points-popup');
	popup.textContent = `+${pts}`;
	popup.style.opacity = '1';
	popup.style.transform = 'translateY(-20px)';

	setTimeout(() => {
		popup.style.opacity = '0';
		popup.style.transform = 'translateY(0)';
	}, 1000);
}

// Function to add points
function addPoints(num) {
	totalPoints += num;
	document.getElementById('points-count').textContent = totalPoints;
	showPointsPopup(num);
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

		// ✅ Skip feedback and result slides
		if (!slide || slide.dataset.role === 'feedback' || slide.id === 'game-results') {
			continue;
		}

		Reveal.slide(i);
		break;
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

function goHome() {
	const tapSound = document.getElementById('tap-sound');
	if (tapSound) {
		tapSound.currentTime = 0;
		tapSound.play().catch(() => { });
	}

	resetGameState();   // Reset slide position
	resetPoints();		//reset points
	resetGameTimer();   // Reset timer
	shuffleQuestions(); // Rebuild question order if needed

	setTimeout(() => {
		Reveal.slide(1, 0);  // Go to the first slide (home)
	}, 0);
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
	let parent = currentSlide;
	let insideGame = false;

	while (parent) {
		if (parent.classList && parent.classList.contains('question-group')) {
			insideGame = true;
			break;
		}
		parent = parent.parentElement;
	}

	if (insideGame) {
		showGameUI();
		startGameTimer();
		gameStarted = true;

		// ✅ START music
		if (bgMusic.paused) {
			bgMusic.play().catch(() => { });
		}
	} else {
		hideGameUI();

		// ✅ STOP music when leaving game
		if (!bgMusic.paused) {
			bgMusic.pause();
			bgMusic.currentTime = 0;
		}
	}
}





// Show pause and timer with fade-in
function showGameUI() {
	const timer = document.getElementById('game-timer');
	const pause = document.querySelector('.pause-button');
	const points = document.getElementById('points-container');
	const musicBtn = document.getElementById('music-toggle');
	if (!timer || !pause || !points) return;

	timer.style.display = 'block';
	pause.style.display = 'block';
	points.style.display = 'flex'; // ✅ Show points

	setTimeout(() => {
		timer.style.opacity = '1';
		pause.style.opacity = '1';
		points.style.opacity = '1';
	}, 50);

	// Auto-play music on first entry
	if (!musicPlaying) {
		bgMusic.volume = 0; // start muted
		bgMusic.play().then(() => {
			let v = 0;
			const fadeIn = setInterval(() => {
				v += 0.05;
				if (v >= lastVolume) {
					bgMusic.volume = lastVolume;
					clearInterval(fadeIn);
				} else {
					bgMusic.volume = v;
				}
			}, 10);
		}).catch(() => {
			// autoplay blocked — ignore
		});
		musicPlaying = true;
	}

	musicBtn.style.display = 'block';
	setTimeout(() => {
		musicBtn.style.opacity = '1';
	}, 50);

	volumeSlider.style.display = 'block';
	setTimeout(() => {
		volumeSlider.style.opacity = '1';
	}, 50);

}


// Hide pause and timer completely
function hideGameUI() {
	const timer = document.getElementById('game-timer');
	const pause = document.querySelector('.pause-button');
	const points = document.getElementById('points-container');
	const musicBtn = document.getElementById('music-toggle');

	if (!timer || !pause || !points || !musicBtn) return;

	timer.style.display = 'none';
	pause.style.display = 'none';
	points.style.display = 'none';
	musicBtn.style.display = 'none'; // ✅ Just hide, don’t stop music
	volumeSlider.style.display = 'none';

}

//Toggle Button Logic
musicBtn.addEventListener('click', () => {
	if (bgMusic.volume > 0) {
		// Mute: store current volume and set to 0
		lastVolume = bgMusic.volume;
		bgMusic.volume = 0;
		volumeSlider.value = 0;
		musicBtn.style.backgroundImage = "url('Math-Project/mute-music.png')";
	} else {
		// 🔊 Unmute: restore previous volume
		bgMusic.volume = lastVolume;
		volumeSlider.value = lastVolume;
		musicBtn.style.backgroundImage = "url('Math-Project/unmute-music.png')";
	}
});



//slider control:
const volumeSlider = document.getElementById('volume-slider');
volumeSlider.addEventListener('input', () => {
	const vol = parseFloat(volumeSlider.value);
	bgMusic.volume = vol;

	volumeSlider.addEventListener('input', () => {
		const vol = parseFloat(volumeSlider.value);
		bgMusic.volume = vol;

		if (vol > 0) {
			lastVolume = vol; // Save last non-zero volume
			musicBtn.style.backgroundImage = "url('Math-Project/unmute-music.png')";
		} else {
			musicBtn.style.backgroundImage = "url('Math-Project/mute-music.png')";
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
	const target = e.target.closest('#btn-replay, #btn-tutorial');
	if (!target) return;

	if (target.id === 'btn-replay') {
		const tapSound = document.getElementById('tap-sound');
		if (tapSound) tapSound.play();

		resetGameState();
		resetPoints();
		resetGameTimer();
		shuffleQuestions();
		correctStreak = 0;
		wrongStreak = 0;
		correctGameAnswers = 0;

		setTimeout(() => {
			const startSlide = document.getElementById('start-game');
			const hIndex = Array.from(Reveal.getHorizontalSlides()).indexOf(startSlide);
			if (hIndex !== -1) Reveal.slide(hIndex, 0);
		}, 0);
	}

	if (target.id === 'btn-tutorial') {
		const tapSound = document.getElementById('tap-sound');
		if (tapSound) tapSound.play();

		resetGameState();
		resetPoints();
		resetGameTimer();
		shuffleQuestions();
		correctStreak = 0;
		wrongStreak = 0;
		correctGameAnswers = 0;

		setTimeout(() => {
			Reveal.slide(1, 0);
		}, 0);
	}

});


function playAudio(id) {
	const audio = document.getElementById(id);
	if (audio) {
		audio.currentTime = 0;
		audio.play().catch(e => console.error("Audio play error:", e));
	}
}


//need to check if to keep this!
Reveal.on('slidechanged', (event) => {
	const current = event.currentSlide;
	if (current.classList.contains('question-slide')) {
		current.classList.add('fade-in');
		setTimeout(() => current.classList.remove('fade-in'), 700); // Reset
	}
});

Reveal.on('slidechanged', (event) => {
	document.querySelectorAll('audio').forEach(audio => {
		if (audio.id !== 'bg-music') {
			audio.pause();
			audio.currentTime = 0;
		}
	});
});

Reveal.on('slidechanged', (event) => {
	const slide = event.currentSlide;
	if (slide?.id === 'game-results') {
		// Update both languages using class-based selectors
		document.querySelectorAll('.final-points-count').forEach(el => el.textContent = totalPoints);
		document.querySelectorAll('.final-time').forEach(el => el.textContent = document.getElementById('game-timer').textContent);

		const totalGameQuestions = document.querySelectorAll('.question-group .question-slide[data-question-id]').length;

		document.querySelectorAll('.correct-count').forEach(el => el.textContent = correctGameAnswers);
		document.querySelectorAll('.total-questions').forEach(el => el.textContent = totalGameQuestions);

		// Play result sound
		const resultSound = document.getElementById('earned-points');
		if (resultSound) {
			resultSound.currentTime = 0;
			resultSound.play().catch(() => { });
		}
	}

});

switchLanguage('heb');

Reveal.on('slidechanged', () => {
	document.querySelectorAll('video').forEach(video => {
		video.pause();
		video.currentTime = 0; // optional: reset to start
	});
});

// --- 1. SPIN WHEEL LOGIC ---
export let wheelNames: string[] = [];
let currentRotation = 0; // Track the current rotation in degrees
let isSpinning = false; // Prevent multiple spins at once
export const wheelColors = ['#FC91DD','#D36CFC','#FC6D71','#6AE49B','#766CFC','#8957F7','#170AC2','#FBA66D','#FA5454','#66CC00'];

export let careTaker = "";
export let cgi = 0;

// Callback to notify when spin completes
let onSpinComplete: (() => void) | null = null;
export function setOnSpinComplete(callback: () => void) {
  onSpinComplete = callback;
}

export function drawWheel(names: string[]) {
  const wheelCanvas = document.getElementById('wheelCanvas') as HTMLCanvasElement;
  const wheelCtx = wheelCanvas?.getContext('2d');
  if (!wheelCanvas || !wheelCtx) return;

  // Set wheelNames to the passed names array
  wheelNames = names;
  
  // Update careTaker and cgi based on new names
  if (wheelNames.length > 0) {
    cgi = Math.floor(Math.random() * wheelNames.length); // Random initial selection
    careTaker = wheelNames[cgi];
  }
  
  if(wheelNames.length === 0) return;

  const sliceAngle = (2 * Math.PI) / wheelNames.length;
  const cx = wheelCanvas.width / 2;
  const cy = wheelCanvas.height / 2;

  wheelCtx.clearRect(0, 0, 500, 500);

  wheelNames.forEach((name: string, i: number) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;

    wheelCtx.beginPath();
    wheelCtx.moveTo(cx, cy);
    wheelCtx.arc(cx, cy, 250, start, end);
    wheelCtx.fillStyle = wheelColors[i % wheelColors.length];
    wheelCtx.fill();
    wheelCtx.strokeStyle= '#ffc1c3';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();

    wheelCtx.save();
    wheelCtx.translate(cx, cy);
    wheelCtx.rotate((start + sliceAngle / 2));
    wheelCtx.textAlign = "right";
    wheelCtx.fillStyle = "white";
    wheelCtx.font = "bold 24px Arial";
    wheelCtx.fillText(name, 230, 10);
    wheelCtx.restore();
  });
}

export function spinWheel() {
  const wheelSpinner = document.getElementById('wheelSpinner') as HTMLElement;
  if (!wheelSpinner) return;

  if (wheelNames.length === 0) return alert("Add names first!");
  if (isSpinning) return; // Prevent multiple spins

  isSpinning = true;

  // Random spin: 3-5 full rotations plus a random extra amount
  const minSpins = 3;
  const maxSpins = 5;
  const randomSpins = minSpins + Math.random() * (maxSpins - minSpins);
  const randomExtraDegrees = Math.random() * 360;
  const totalRotation = randomSpins * 360 + randomExtraDegrees;

  // Calculate the final rotation
  const finalRotation = currentRotation + totalRotation;

  // Apply CSS transition for smooth spin with easing (slow down at end)
  wheelSpinner.style.transition = 'transform 2s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  wheelSpinner.style.transformOrigin = 'center center';
  wheelSpinner.style.transform = `rotate(${finalRotation}deg)`;

  // After spin completes (2 seconds), determine the winner
  setTimeout(() => {
    // Normalize the final rotation to 0-360 range
    const normalizedRotation = finalRotation % 360;
    
    // The pointer is at the top (270 degrees in canvas coordinates, or -90 from start)
    // We need to find which slice is at the pointer position
    // Since the wheel rotates clockwise, we need to calculate backwards
    const sliceDeg = 360 / wheelNames.length;
    
    // Pointer is at the top, which is at 270 degrees (or -90 degrees)
    // The first slice starts at 0 degrees (right side) in the canvas
    // After rotation, we need to find which slice ended up at the top
    const pointerAngle = 270; // Top of the wheel
    const adjustedAngle = (pointerAngle - normalizedRotation + 360) % 360;
    
    // Find which slice this angle falls into
    const winnerIndex = Math.floor(adjustedAngle / sliceDeg) % wheelNames.length;
    
    // Update the winner
    cgi = winnerIndex;
    careTaker = wheelNames[cgi];
    
    // Update current rotation for next spin
    currentRotation = finalRotation;
    
    // Show winner
    const resultEl = document.getElementById('wheelWinner');
    if (resultEl) {
      resultEl.textContent = `🎉 ${careTaker} 🎉`;
      resultEl.style.opacity = "1";
      resultEl.style.transition = "opacity 0.5s";
    }

    isSpinning = false;
    
    // Call the completion callback if set
    if (onSpinComplete) {
      onSpinComplete();
    }
  }, 2000);
}

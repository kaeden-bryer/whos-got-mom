// --- 1. SPIN WHEEL LOGIC ---
export let wheelNames: string[] = ["Alice", "Bob", "Charlie", "David", "me", "me4", "something", "else", "lololol", "gogogog"];
let wheelRotation;
const wheelColors = ['#FC91DD','#D36CFC','#FC6D71','#6AE49B','#766CFC','#8957F7','#170AC2','#FBA66D','#FA5454','#66CC00'];

export let careTaker = wheelNames[7];
export let cgi = wheelNames.indexOf(careTaker);

export function drawWheel() {
  const wheelCanvas = document.getElementById('wheelCanvas') as HTMLCanvasElement;
  const wheelCtx = wheelCanvas?.getContext('2d');
  if (!wheelCanvas || !wheelCtx) return;

//   const namesInput = document.getElementById('namesInput') as HTMLTextAreaElement;
//   const text = namesInput?.value || '';
  //wheelNames = text.split('\n').filter((n: string) => n.trim() !== ''); // heres where we add the data (GET users IN "squad.member")
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
  const wheelCanvas = document.getElementById('wheelCanvas') as HTMLCanvasElement;
  if (!wheelCanvas) return;

  if(wheelNames.length === 0) return alert("Add names first!");
  
  // Use the predefined caregiver (cgi is already set to careTaker's index)
  const winner = wheelNames[cgi];
  
  // 3. Calculate rotation to snap winner to pointer (at top)
  const sliceDeg = 360 / wheelNames.length;
  const sliceCenter = cgi * sliceDeg + sliceDeg / 2;
  wheelRotation = ((360 - sliceCenter) % 360) - 90;
  wheelCanvas.style.transform = `rotate(${wheelRotation}deg)`;
  wheelCanvas.style.transformOrigin = 'center center';

  // 4. Show winner immediately
  const resultEl = document.getElementById('wheelWinner');
  if(resultEl) {
    resultEl.textContent = `🎉 ${winner} 🎉`;
    resultEl.style.opacity = "1";
    resultEl.style.transition = "opacity 0.5s";
  }
}

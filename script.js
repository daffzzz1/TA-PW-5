// Calculator logic with operator precedence, history, memory, keyboard support

const displayEl = document.getElementById('display');
const historyEl = document.getElementById('history-display');
const memoryIndicator = document.getElementById('memory-indicator');

let currentEntry = '0';
let expression = []; // tokens
let memory = 0;
let history = []; // last 5 calculations

function updateDisplay(){
  displayEl.textContent = currentEntry;
  historyEl.textContent = history.slice().reverse().join('  •  ');
  memoryIndicator.textContent = `M: ${memory}`;
}

function pushNumber(num){
  if (currentEntry === '0' && num !== '.') currentEntry = num;
  else if (num === '.' && currentEntry.includes('.')) return;
  else currentEntry += num;
  updateDisplay();
}

function clearAll(){
  currentEntry = '0';
  expression = [];
  updateDisplay();
}

function clearEntry(){
  currentEntry = '0';
  updateDisplay();
}

function pushOperator(op){
  // push current entry then operator
  expression.push(currentEntry);
  expression.push(op);
  currentEntry = '0';
  updateDisplay();
}

function toTokens(exprArray){
  // exprArray is a mix of numbers (strings) and operator symbols
  // returns token list
  return exprArray.map(x => {
    if (['+','-','*','/'].includes(x)) return {type:'op', value:x};
    return {type:'num', value:parseFloat(x)};
  });
}

// Shunting-yard to RPN
function toRPN(tokens){
  const output = [];
  const ops = [];
  const prec = {'+':1, '-':1, '*':2, '/':2};
  tokens.forEach(t => {
    if (t.type === 'num') output.push(t);
    else if (t.type === 'op'){
      while(ops.length && prec[ops[ops.length-1].value] >= prec[t.value]){
        output.push(ops.pop());
      }
      ops.push(t);
    }
  });
  while(ops.length) output.push(ops.pop());
  return output;
}

function evalRPN(rpn){
  const st = [];
  for(const t of rpn){
    if (t.type === 'num') st.push(t.value);
    else {
      const b = st.pop();
      const a = st.pop();
      let res = null;
      if (t.value === '+') res = a + b;
      else if (t.value === '-') res = a - b;
      else if (t.value === '*') res = a * b;
      else if (t.value === '/'){
        if (b === 0) throw new Error('DIV_ZERO');
        res = a / b;
      }
      st.push(res);
    }
  }
  return st.pop();
}

function calculateFinal(){
  // build full expression tokens: expression + currentEntry
  const exprArr = expression.slice();
  exprArr.push(currentEntry);
  const tokens = toTokens(exprArr);
  const rpn = toRPN(tokens);
  const result = evalRPN(rpn);
  return result;
}

function doEquals(){
  try{
    const result = calculateFinal();
    const exprStr = (expression.join(' ') + ' ' + currentEntry).trim();
    const displayResult = Number.isFinite(result) ? (Math.round(result * 1e12)/1e12).toString() : 'Error';
    // save to history
    history.push(`${exprStr} = ${displayResult}`);
    if (history.length > 5) history.shift();
    // reset expression, set currentEntry to result
    currentEntry = displayResult;
    expression = [];
    updateDisplay();
  }catch(err){
    if (err.message === 'DIV_ZERO'){
      currentEntry = 'Error (div by 0)';
      expression = [];
      updateDisplay();
    } else {
      currentEntry = 'Error';
      expression = [];
      updateDisplay();
      console.error(err);
    }
  }
}

// Memory functions
function memoryClear(){ memory = 0; updateDisplay(); }
function memoryRecall(){ currentEntry = (memory).toString(); updateDisplay(); }
function memoryAdd(){ memory = memory + parseFloat(currentEntry || 0); updateDisplay(); }
function memorySub(){ memory = memory - parseFloat(currentEntry || 0); updateDisplay(); }

// Button wiring
document.querySelectorAll('.btn').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const key = btn.getAttribute('data-key');
    const op = btn.getAttribute('data-op');
    if (key && /[0-9.]/.test(key)){
      pushNumber(key);
      return;
    }
    if (op){
      pushOperator(op);
      return;
    }
    const id = btn.id;
    if (id === 'equals'){
      doEquals();
    } else if (id === 'clear'){
      clearAll();
    } else if (id === 'clear-entry'){
      clearEntry();
    } else if (id === 'mc'){
      memoryClear();
    } else if (id === 'mr'){
      memoryRecall();
    } else if (id === 'mplus'){
      memoryAdd();
    } else if (id === 'mminus'){
      memorySub();
    }
  });
});

// Keyboard support
window.addEventListener('keydown', (e)=>{
  // numbers and decimal
  if ((e.key >= '0' && e.key <= '9') || e.key === '.'){
    pushNumber(e.key);
    e.preventDefault();
    return;
  }
  // operators
  if (['+','-','*','/'].includes(e.key)){
    pushOperator(e.key);
    e.preventDefault();
    return;
  }
  if (e.key === 'Enter' || e.key === '='){
    doEquals();
    e.preventDefault();
    return;
  }
  if (e.key === 'Backspace'){
    // CE behavior: delete last char of currentEntry
    if (currentEntry.length <= 1) currentEntry = '0';
    else currentEntry = currentEntry.slice(0, -1);
    updateDisplay();
    e.preventDefault();
    return;
  }
  if (e.key === 'Escape'){
    clearAll();
    e.preventDefault();
    return;
  }
});

// initialize
updateDisplay();

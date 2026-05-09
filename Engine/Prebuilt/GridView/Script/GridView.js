(function() {
  const initGrid = (el) => {
    // Helper: Finds attribute even if browser converts it to lowercase
    const getAttr = (n) => el.getAttribute(n) || el.getAttribute(n.toLowerCase());
    
    // Helper: Ensures numbers have 'px' and returns '0px' if missing or negative
    const parseDim = (val) => {
      if (!val) return '0px';
      const num = parseFloat(val);
      // CSS Grid gaps and padding cannot be negative. If negative or invalid, force 0px.
      if (isNaN(num) || num < 0) return '0px';
      // If the user typed "10", convert to "10px". If "10%", leave it alone.
      return isNaN(val) ? val : val + 'px';
    };
    
    const rows = getAttr('Row') || '1';
    const cols = getAttr('Col') || '1';
    
    // Horizontal space uses GapX, Vertical space uses GapY
    const gX = getAttr('GapX');
    const gY = getAttr('GapY');
    
    Object.assign(el.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, auto)`,
      columnGap: parseDim(gX),
      rowGap: parseDim(gY),
      paddingTop: parseDim(getAttr('GapTop')),
      paddingBottom: parseDim(getAttr('GapBottom')),
      paddingLeft: parseDim(getAttr('GapLeft')),
      paddingRight: parseDim(getAttr('GapRight'))
    });
    
    // Handle ColumnSpan children
    el.querySelectorAll(':scope > ColumnSpan').forEach(span => {
      const range = span.getAttribute('ColRange') || span.getAttribute('colrange') || '1';
      span.style.gridColumn = `span ${range}`;
    });
  };
  
  const setup = () => document.querySelectorAll('GridView').forEach(initGrid);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  
  new MutationObserver((mutations) => {
    mutations.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1) {
        if (n.tagName === 'GRIDVIEW') initGrid(n);
        n.querySelectorAll?.('GridView').forEach(initGrid);
      }
    }));
  }).observe(document.body, { childList: true, subtree: true });
})();
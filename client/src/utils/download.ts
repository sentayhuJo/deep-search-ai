export const downloadReport = (report: string) => {
    const element = document.createElement('a');
    const file = new Blob([report], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = 'research-report.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
const fs = require('fs');
let code = fs.readFileSync('scratch/test_unclosed_months.js', 'utf8');
code = code.replace(
  `  const ParkingApp = sandbox.NNApp || sandbox.ParkingApp;\n  if (!ParkingApp) throw new Error('ParkingApp class not defined on context!');\n\n  const app = new ParkingApp();`,
  `  const app = sandbox.window.app || new (sandbox.NNApp || sandbox.window.NNApp)();\n  if (!app) throw new Error('app instance not created!');`
);
fs.writeFileSync('scratch/test_unclosed_months.js', code, 'utf8');


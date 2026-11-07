// Keep the downloadable deployment file identical to the code shown in the app.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'js/google-sheets-sync.js'),'utf8'),context);
fs.writeFileSync(path.join(root,'apps-script-v2.gs'),vm.runInContext('APPS_SCRIPT_CODE',context));
console.log('Exported apps-script-v2.gs');

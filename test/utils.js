//From http://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
import fs from 'fs'

export default function rmdirSync (path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    })
    fs.rmdirSync(path)
  }
}
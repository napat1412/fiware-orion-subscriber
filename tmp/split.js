var p = "a"
//var a = p.split( '/' ).where((s) => !s.isEmpty).toList();
var a = p.split( '/' ).filter(f => f != '');
console.log(a.length)
console.log(a);

if (a.length == 2) {
  console.log("/"+a[0]+"/_doc");
  console.log("type: "+a[1]);
}

else if (a.length == 1) {
  console.log("/"+a[0]+"/_doc");
  console.log("type: default doc");
}

else {
  console.log("path is incorrect");
}

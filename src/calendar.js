const URI = require('urijs');

let getIcsUri = function(url){
    let uri = URI(url);
    let new_uri = new URI({
      protocol: "https",
      hostname: "easyacademy.unitn.it",
      path: "/AgendaStudentiUnitn/export/ec_download_ical_list.php",
    });
    let old_search = uri.search(true);
    switch (old_search["include"]) {
      case "corso":
        new_uri.search(
          { "include": "corso"
          , "anno": old_search["anno"]
          , "corso": old_search["corso"]
          , "anno2[]": old_search["anno2[]"]
          , "ar_codes_": old_search["ar_codes_"]
          , "ar_select_": old_search["ar_select_"]
        });
        break;
      case "attivita":
        new_uri.search(
          { "include": "attivita"
          , "anno": old_search["anno"]
          , "attivita[]": old_search["attivita[]"]
          , "ar_codes_": old_search["ar_codes_"]
          , "ar_select_": old_search["ar_select_"]
        });
        break;
      default:
        //TODO put this in a red box
        console.log("Error: include not found");
        return;
    }
    let final_uri = new_uri.toString()
      + "&dummyext.ics"; // needed for gnome-calendar and other programs taht require an .ics extension
    
    console.log("final_uri: " + final_uri);

  
  return final_uri;
} // 




module.exports = getIcsUri;

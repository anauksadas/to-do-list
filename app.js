const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + "/views/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

//let items = ["Buy Food", "Cook Food", "Eat Food" ];
//let workItems = [];
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main(){
   await mongoose.connect('mongodb+srv://anauksadas:loyaloya@cluster0.7irmsrb.mongodb.net/todolistDB?retryWrites=true&w=majority'); 

   const itemsSchema = {
    name: String
   };

   const Item = mongoose.model("Item", itemsSchema);

   const item1 = new Item({
    name: "Welcome to your to-do list!"
   });
   const item2 = new Item({
    name: "Hit the + button to add a new item."
   });
   const item3 = new Item({
    name: "<-- Hit this to delete an item."
   });

   const defaultItems = [item1, item2, item3];

   const listSchema = {
    name: String,
    items: [itemsSchema]
   };

   const List = mongoose.model("List", listSchema);

    // Item.find({})
    //     .then(function(items){
    //         console.log(items);
    //     })
    //     .catch(err => console.log(err));


    app.get('/', function(req,res){

        //let day = date();
    
        const findItem = async function(){
            Item.find({})
            .then(function(foundItems){

                if(foundItems.length === 0){
                    Item.insertMany(defaultItems)
                        .then(function(){
                            console.log("Inserted default items to DB");
                        })
                        .catch(err => console.log(err));
                }
                res.render("list", {listTitle : "Today", newListItem: foundItems});
            })
            .catch(err => console.log(err));
        }
    
        findItem();    
    
    });

    app.get("/:customListName", function(req,res){
        const customListName = _.capitalize(req.params.customListName);

        List.findOne({name: customListName})
        .then(function(foundList){
            if(!foundList){
                //Create a new list   
                const list = new List({
                name: customListName,
                items: defaultItems
                });

                list.save();
                res.redirect("/"+customListName);
            
            }
            else{
               res.render("list", {listTitle : foundList.name, newListItem: foundList.items}); 
            }
            
        });

        
    })


    app.post('/', function(req,res){
        const itemName = req.body.newItem;
        const listName = req.body.list;
    
        const newItem = new Item({
            name: itemName
        });

        if(listName === "Today"){
            newItem.save();

            res.redirect('/');
        }
        else{
            List.findOne({name: listName})
            .then(function(docs){

                const items = docs.items;
                items.push(newItem);
                docs.save();
                res.redirect("/"+listName);
            })
        }
        


        // if (req.body.list ==="Work List"){
        //     workItems.push(newItem);
        //     res.redirect("/work");
        // }
        // else{
        //     items.push(newItem);
        //     res.redirect('/');
        // }
        
    });

    app.post("/delete", function(req,res){
        const checkedItemId = (req.body.checkbox);
        const listName = req.body.listName;

        if(listName === "Today"){
            Item.findByIdAndRemove(checkedItemId)
            .then(function(){
                console.log("Deleted!");
            })
            .catch(err => console.log(err));

            res.redirect('/');
        }
        else{
            List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .then(function(){
              res.redirect('/'+listName);  
            })
        }        
    });
}

app.listen(3000, function(){
    console.log("Server started on port 3000");
});
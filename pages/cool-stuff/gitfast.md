function gitfast() {
  git add .
  git commit -am "$1"
  git push
}
👇 Steps to fix:
Open your .bashrc:

bash
Copy code
nano ~/.bashrc
Add this clean version at the bottom.

Save and reload:

bash
Copy code
source ~/.bashrc
🚀 Now use it like this:
bash
Copy code
gitfast "Added login feature"

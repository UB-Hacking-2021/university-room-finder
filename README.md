# About

Have you ever wanted to book a study room for your group project, but they were all taken? Maybe you'll walk around and hop into a random empty classroom only for a class to start there shortly. **With UB Findin' a Room**, these problems are no more!

**University Room Finder**, also branded as **UB Findin' a Room**, is our 2021 UB Hacking hackathon project. It scrapes UB's online class schedule to identify and present room openings between classes. A user can enter a preferred building, day, and time that they want a room. Our program will use our database of courses and rooms, derived from the online course schedule, to find what rooms will be available for the longest time from now, favoring rooms in the specified building.


# Improvements we'd like to make

Since this was a hackathon project, we didn't have time to implement everything we wanted. Here were some of our ideas for improvements.
* Design a nice front-end
* Remove rooms that aren't open to the public, such as laboratories
* Automatically fill the day and time field with their present values
* Add an option to ignore rooms available until 11:59 PM because they're probably not actually available for student use
* Incorporate building proximity knowledge to suggest rooms in buildings *near* the specified building
* Implement fuzzy search (i.e. UB calls "Hochstetter" "hoch" in their database, but our search doesn't support that right now)

# Image

![image](https://user-images.githubusercontent.com/32116122/140654668-78347f79-39aa-4095-9cf0-7b988d50e768.png)


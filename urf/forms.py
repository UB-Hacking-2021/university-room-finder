from django import forms


class MainForm(forms.Form):
    building_name = forms.CharField(label='Building name', max_length=100)
    day_options = (
        ("sunday", "Sunday"),
        ("monday", "Monday"),
        ("tuesday", "Tuesday"),
        ("wednesday", "Wednesday"),
        ("thursday", "Thursday"),
        ("friday", "Friday"),
        ("saturday", "Saturday"),
    )
    day = forms.ChoiceField(widget=forms.Select, choices=day_options)
    time = forms.TimeField()

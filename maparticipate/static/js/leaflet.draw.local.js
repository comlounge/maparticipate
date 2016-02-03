$(document).ready(function(){
    L.drawLocal = {
        draw: {
            toolbar: {
                actions: {
                    title: 'Cancel drawing',
                    text: 'Abbrechen'
                },
                undo: {
                    title: 'Delete last point drawn',
                    text: 'Letzten Punkt löschen'
                },
                buttons: {
                    polyline: 'Eine Strecke zeichnen',
                    polygon: 'Draw a polygon',
                    rectangle: 'Draw a rectangle',
                    circle: 'Draw a circle',
                    marker: 'Draw a marker'
                }
            },
            handlers: {
                circle: {
                    tooltip: {
                        start: 'Click and drag to draw circle.'
                    },
                    radius: 'Radius'
                },
                marker: {
                    tooltip: {
                        start: 'Click map to place marker.'
                    }
                },
                polygon: {
                    tooltip: {
                        start: 'Click to start drawing shape.',
                        cont: 'Click to continue drawing shape.',
                        end: 'Click first point to close this shape.'
                    }
                },
                polyline: {
                    error: '<strong>Error:</strong> shape edges cannot cross!',
                    tooltip: {
                        start: 'Klicken, um die Strecken zu beginnen',
                        cont: 'Klicken um die Strecke weiter zu zeichnen',
                        end: 'Klicken, um die Strecke zu beenden'
                    }
                },
                rectangle: {
                    tooltip: {
                        start: 'Click and drag to draw rectangle.'
                    }
                },
                simpleshape: {
                    tooltip: {
                        end: 'Release mouse to finish drawing.'
                    }
                }
            }
        },
        edit: {
            toolbar: {
                actions: {
                    save: {
                        title: 'Save changes.',
                        text: 'Speichern'
                    },
                    cancel: {
                        title: 'Cancel editing, discards all changes.',
                        text: 'Abbrechen'
                    }
                },
                buttons: {
                    edit: 'Ebene editieren.',
                    editDisabled: 'Keine Ebene vorhanden, die editiert werden kann.',
                    remove: 'Ebene löschen.',
                    removeDisabled: 'Keine Ebene vorhanden, die gelöscht werden kann.'
                }
            },
            handlers: {
                edit: {
                    tooltip: {
                        text: 'Strecke bearbeiten',
                        //text: 'Drag handles, or marker to edit feature.',
                        //subtext: 'Auf "Abbrechen" klicken, um Änderungen rückgängig zu machen.'
                    }
                },
                remove: {
                    tooltip: {
                        text: 'Click on a feature to remove'
                    }
                }
            }
        }
    };
})

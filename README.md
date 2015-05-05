# **ol-photon** project

It's a direct port of Leaflet-photon code available at https://github.com/komoot/leaflet.photon

The Leaflet demo is in production for the French BAN (Base Adresse Nationale), a database dedicated to French adresses.
You can see it in action at http://adresse.data.gouv.fr/map/

For the OpenLayers 3 project, we changed some parts and although we didn't try it in other projections, it should work with any projections.

We made the component so you can choose to use:

* an OpenLayers `control` (hence you can do the `map.addControl` stuff)
* a simple html container using standalone functions without using OpenLayers controls mechanism (although you are tied to OpenLayers for the zoom part.

You can see [a demo in action](https://rawgit.com/webgeodatavore/ol3-photon/master/demo/index.html)

Feel free to [open an issue](https://github.com/webgeodatavore/ol3-photon/issues) if you see some errors or improvements to do.

You can also directly contact us at contact(at)@webgeodatavore.com or [ping us on Twitter](http://twitter.com/thomasg77)

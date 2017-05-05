// VARIABLES
let GLOBAL_NODES,
    GLOBAL_LINKS,
    INTRO = {
      nodes: [
        3,
        28,
        15,
        26,
        12,
        31
      ],
      nodes_description: [
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      ]
    },
    SANKEY = {
      margin: {
        top: 40,
        right: 200,
        bottom: 40,
        left: 200,
        header: 20
      },
      separacionNodo: 20,
      anchoNodo: 20,
      secciones_header: [
        ['ENERGÍAS', 'PRIMARIAS'],
        ['CENTROS DE', 'TRANSFORMACIÓN'],
        ['ENERGÍAS', 'SECUNDARIAS'],
        ['CENTROS DE', 'TRANSFORMACIÓN'],
        ['ENERGÍAS', 'SECUNDARIAS'],
        ['SECTORES', 'DE CONSUMOS']
      ]
    },
    SELECTORES = {
      categorias: [
        ['Energías primarias', ['categorias1', 'categorias1', 'categorias1', 'categorias1', 'categorias1']],
        ['Energías secundarias', ['categorias2', 'categorias2', 'categorias2', 'categorias2', 'categorias2']],
        ['Energías terciarias', ['categorias3', 'categorias3', 'categorias3', 'categorias3', 'categorias3']],
        ['Centros de transformación', ['categorias4', 'categorias4', 'categorias4', 'categorias4', 'categorias4']],
        ['Consumos', ['categorias5', 'categorias5', 'categorias5', 'categorias5', 'categorias5']],
        ['No aprovechables', ['categorias6', 'categorias6', 'categorias6', 'categorias6', 'categorias6']]
      ],
      anio: []
    },
    COLORES_FLUJO = {
      importacion:  '#FFCF87',
      exportacion:  '#00897B',
      produccion:   '#7FC6E6',
      perdida:      '#ED7960',
      default:      '#CFD8DC'
    };

// FUNCIONES
const BUSCAR_NODO = (id, modificador = 0) => (GLOBAL_NODES.filter((element) => element.id === id + modificador)[0]);

$(() => {

  let height      = $('#sankey').height(),
      width       = $('#sankey').width(),
      nodesOri, linksOri, allLinks,
      nodesGlo, linksGlo, allNodes,
      sankeyChartD3, path, svg;

  const obtenerNodosIntro = () => {
    INTRO.nodes.forEach((v, k) => {
      INTRO.nodes[k] = BUSCAR_NODO(v);
    });

    return true;
  };
  const tooltipIn = (d) => {

    $('#tooltip').css({ top: $('#sankey svg').position().top + d.y + 7, left: $('#sankey svg').position().left + d.x + 210 });

    if (d.posicionX === 1 || d.posicionX === 3 || d.posicionX === 5) {
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(d.oferta_interna);
      $('.tooltip_production').parent().parent().removeAttr('style');
      $('.tooltip_production').text(d.produccion);
      $('.tooltip_importation').parent().parent().removeAttr('style');
      $('.tooltip_importation').text(d.importacion);
      $('.tooltip_exportation').parent().parent().removeAttr('style');
      $('.tooltip_exportation').text(d.exportacion);
      $('.tooltip_losses').parent().parent().removeAttr('style');
      $('.tooltip_losses').text(d.perdidas);
      $('.tooltip_others').parent().parent().removeAttr('style');
      $('.tooltip_others').text(d.otros);
    } else if (d.posicionX === 2 || d.posicionX === 4) {
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(d.consumo);
      $('.tooltip_production').parent().parent().removeAttr('style');
      $('.tooltip_production').text(d.produccion);
      $('.tooltip_importation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_exportation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_losses').parent().parent().removeAttr('style');
      $('.tooltip_losses').text(d.perdidas);
      $('.tooltip_others').parent().parent().removeAttr('style');
      $('.tooltip_others').text(d.otros);
    } else {
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(d.consumo);
      $('.tooltip_production').parent().parent().css({ 'display': 'none' });
      $('.tooltip_importation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_exportation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_losses').parent().parent().css({ 'display': 'none' });
      $('.tooltip_others').parent().parent().css({ 'display': 'none' });
    }
  };
  const fade = (type = null, id = null) => (g, i) => {
    let element_id  = (id === null)?(g.id):(id),
        event_node;

    switch (type) {
      case 'fadeIn':
        // Nodo Seleccionado
        event_node = d3.select(`#node_${ element_id }`);
        event_node.select('rect').transition().style('stroke', 'black');
        event_node.select('text').transition().style('fill', 'black');
        // Nodos Relacionados
        allLinks.each((v, k) => {
          if (v.source.id === element_id) { d3.select(`#node_${ v.target.id }`).select('text').transition().style('fill', 'black');
        } else if (v.target.id === element_id) { d3.select(`#node_${ v.source.id }`).select('text').transition().style('fill', 'black'); }
        });

        // Links Producción
        allLinks.filter((d) => (d.source.id === element_id && d.target.id !== 37 && d.target.id !== 43 || d.target.id === element_id && d.source.id !== 42))
          .transition().duration(100)
          .style('stroke', 'url(#gradient_prod)')
          .style('stroke-opacity', 0.5);
        // Links Importación
        allLinks.filter((d) => (d.source.id === 42 && d.target.id === element_id))
          .transition().duration(100)
          .style('stroke', 'url(#gradient_imp)')
          .style('stroke-opacity', 0.5);
        // Links Exportación
        allLinks.filter((d) => (d.source.id === element_id && d.target.id === 43))
          .transition().duration(100)
          .style('stroke', 'url(#gradient_exp)')
          .style('stroke-opacity', 0.5);
        // Links Pérdida
        allLinks.filter((d) => (d.source.id === element_id && d.target.id === 37 || d.target.id === element_id && element_id === 37))
          .transition().duration(100)
          .style('stroke', COLORES_FLUJO.perdida)
          .style('stroke-opacity', 0.5);

        tooltipIn(g);
        break;
      case 'fadeOut':
        // Nodo Seleccionado
        event_node = d3.select(`#node_${ element_id }`);
        event_node.select('rect').transition().style('stroke', null);
        event_node.select('text').transition().style('fill', null);
        // Nodos Relacionados
        allLinks.each((v, k) => {
          if (v.source.id === element_id) { d3.select(`#node_${ v.target.id }`).select('text').transition().style('fill', null);
        } else if (v.target.id === element_id) { d3.select(`#node_${ v.source.id }`).select('text').transition().style('fill', null); }
        });

        // Links Producción
        allLinks.filter((d) => (d.source.id === element_id && d.target.id !== 37 && d.target.id !== 43 || d.target.id === element_id && d.source.id !== 42))
          .transition().duration(100)
          .style('stroke', COLORES_FLUJO.default)
          .style('stroke-opacity', null);
        // Links Importación
        allLinks.filter((d) => (d.source.id === 42 && d.target.id === element_id))
          .transition().duration(100)
          .style('stroke', 'url(#gradient_imp_default)')
          .style('stroke-opacity', null);
        // Links Exportación
        allLinks.filter((d) => (d.source.id === element_id && d.target.id === 43))
          .transition().duration(100)
          .style('stroke', 'url(#gradient_exp_default)')
          .style('stroke-opacity', null);
        // Links Pérdida
        allLinks.filter((d) => (d.source.id === element_id && d.target.id === 37 || d.target.id === element_id && element_id === 37))
          .transition().duration(100)
          .style('stroke', COLORES_FLUJO.default)
          .style('stroke-opacity', null);

        $('#tooltip').removeAttr('style');
        break;
    }
  };
  const intro = (stage, state = 'normal', action = 'none') => {
    let link_dom = d3.selectAll('#sankey .link').filter((link) => (link.source.id === INTRO.nodes[stage].id && link.target.id === INTRO.nodes[(stage + 1)].id)),
        node_dom = d3.selectAll('#sankey .node').filter((node) => (node.id === INTRO.nodes[stage].id)),
        intro_container, intro_buttons,
        button_last, button_next;

    const node_on = (node) => {
      node_dom.select('rect').transition().style('stroke', 'black');
      node_dom.select('text').transition().style('fill', 'black');
    };
    const node_off = (node) => {
      node_dom.select('rect').transition().style('fill', null).style('stroke', null);
      node_dom.select('text').transition().style('fill', null);
    };
    const link_on = (node, next_node) => {
      link_dom.style('stroke', 'url(#gradient_link)').style('stroke-opacity', 0.5);
    };
    const link_off = (node, next_node) => {
      link_dom.style('stroke', null).style('stroke-opacity', null);
    };

    switch (state) {
      case 'create':
        d3.select('#content').append('div').attr('id', 'intro_screen').style('top', '0px').style('left', '0px');
        intro_container = d3.select('#content').append('div').attr('id', 'tooltip_intro').style('bottom', '20px').style('right', '20px');
          intro_container.append('div');
          intro_container.select('div').attr('class', 'flex flex_justify_between flex_align_start').append('h2').attr('class', 'tooltip_name');
          intro_container.select('div').append('span').attr('class', 'glyphicon glyphicon-remove tooltip_exit');
          intro_container.append('p').attr('class', 'tooltip_production');
        intro_buttons   = intro_container.append('div').attr('class', 'flex flex_justify_between');
        button_last     = intro_buttons.append('button').attr('id', 'last').text('Anterior');
        button_next     = intro_buttons.append('button').attr('id', 'next').text('Siguiente');

        $('.tooltip_exit').on('click', () => {
          intro(stage, 'delete', 'none');
        });
        $(document).keyup((e) => {
          if (e.keyCode === 27 && $('.tooltip_exit').length === 1 ) { intro(stage, 'delete', 'none'); }
        });

        break;
      case 'delete':
        d3.select('#tooltip_intro').remove();
        d3.select('#intro_screen').remove();
        d3.selectAll('#sankey .node rect').transition().style('fill', null).style('stroke', null);
        d3.selectAll('#sankey .node text').transition().style('fill', null);
        d3.selectAll('#sankey .link').filter((d) => (d.source.id !== 42 && d.target.id !== 43)).transition().style('stroke', null).style('stroke-opacity', null);
        return false;
      case 'normal':
        intro_container = d3.select('#tooltip_intro');
        intro_buttons   = intro_container.select('div:nth-child(3)');
        button_last     = intro_buttons.select('#last');
        button_next     = intro_buttons.select('#next');
        break;
    }
    switch (action) {
      case 'next':
        node_on(INTRO.nodes[stage]);
        link_on(INTRO.nodes[stage], INTRO.nodes[stage + 1]);
        break;
      case 'back':
        node_off(INTRO.nodes[stage + 1]);
        link_off(INTRO.nodes[stage + 1], INTRO.nodes[stage + 2]);
        break;
    }

    intro_container.select('h2').text(INTRO.nodes[stage].nombre);
    intro_container.select('p').text(INTRO.nodes_description[stage]);

    if (stage === 0) {
      button_last.attr('class', 'btn btn-default btn-xs disabled').on('click', () => { intro(stage, 'normal', 'none'); });
      button_next.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage + 1, 'normal', 'next'); });
    } else if (stage === (INTRO.nodes.length - 1)) {
      button_last.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage - 1, 'normal', 'back'); });
      button_next.attr('class', 'btn btn-primary btn-xs').text('Comenzar').on('click', () => { intro(stage, 'delete', 'none'); });
    } else {
      button_last.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage - 1, 'normal', 'back'); });
      button_next.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage + 1, 'normal', 'next'); });
    }
  };
  const downloadFile = (anio) => {
    let promise = new Promise((success) => {
      d3.json(`public/src/data_${anio}.json`, (data) => {

        GLOBAL_NODES = data.nodes;
        GLOBAL_LINKS = data.links;

        success();
      });
    });

    return promise;
  };
  const dibujarSankey = (width, heigth, data, options) => {
    // Se definen variables
    let headerSize      = 38,
        margin          = options.margin,
        size            = { width: 1400 - margin.left - margin.right, height: heigth - margin.top - margin.bottom - margin.header - headerSize },
        anchoNodo       = options.anchoNodo,
        separacionNodo  = options.separacionNodo,
        posColumnas     = [];

    // Creación SVG
    svg = d3.select('#sankey')
      .append('svg')
      .attr('width', size.width + margin.right + margin.left)
      .attr('height', size.height + margin.top + margin.bottom + margin.header + headerSize)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    // Se agregan encabezados
    let encabezado = svg.append('g')
      .attr('id', 'chart-encabezado')
      .attr('transform', `translate(${ margin.left }, ${ margin.top + 15 })`);
      encabezado.append('text')
        .attr('class', 'chart-encabezado-left')
        .attr('x', -10)
        .text(SANKEY.secciones_header[0][0]);
      encabezado.append('text')
        .attr('class', 'chart-encabezado-left')
        .attr('x', -10)
        .attr('y', 19)
        .text(SANKEY.secciones_header[0][1]);
    // Se crea grafico
    let chart = svg.append('g')
      .attr('transform', `translate(${ margin.left }, ${ margin.top + $('#chart-encabezado')[0].getBBox().height + margin.header })`);
    // Creación Sankey
    sankeyChartD3 = d3.sankey()
      .nodeWidth(anchoNodo)
      .nodePadding(separacionNodo)
      .size([size.width, size.height])
      .nodes(data.nodes)
      .links(data.links)
      .layout();
    // Generación de gradientes
    let defs = svg.append('defs');

    let gradient_imp = defs.append('linearGradient').attr('id', 'gradient_imp').attr('x1', '100%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
        gradient_imp.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.importacion).attr('stop-opacity', 1);
        gradient_imp.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.importacion).attr('stop-opacity', 1);
        gradient_imp.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.importacion).attr('stop-opacity', 0);
    let gradient_imp_default = defs.append('linearGradient').attr('id', 'gradient_imp_default').attr('x1', '100%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
        gradient_imp_default.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
        gradient_imp_default.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
        gradient_imp_default.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 0);
    let gradient_exp = defs.append('linearGradient').attr('id', 'gradient_exp').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        gradient_exp.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.exportacion).attr('stop-opacity', 1);
        gradient_exp.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.exportacion).attr('stop-opacity', 1);
        gradient_exp.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.exportacion).attr('stop-opacity', 0);
    let gradient_exp_default = defs.append('linearGradient').attr('id', 'gradient_exp_default').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        gradient_exp_default.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
        gradient_exp_default.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
        gradient_exp_default.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 0);
    let gradient_prod = defs.append('linearGradient').attr('gradientUnits', 'userSpaceOnUse').attr('id', 'gradient_prod').attr('x1', '0%').attr('y1', '50%').attr('x2', '100%').attr('y2', '50%');
        gradient_prod.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(32,106,171)').attr('stop-opacity', 1);
        gradient_prod.append('stop').attr('offset', '20%').attr('stop-color', 'rgb(0,117,201)').attr('stop-opacity', 1);
        gradient_prod.append('stop').attr('offset', '40%').attr('stop-color', 'rgb(0,157,218)').attr('stop-opacity', 1);
        gradient_prod.append('stop').attr('offset', '60%').attr('stop-color', 'rgb(77,203,236)').attr('stop-opacity', 1);
        gradient_prod.append('stop').attr('offset', '80%').attr('stop-color', 'rgb(127,218,241)').attr('stop-opacity', 1);
        gradient_prod.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(178,233,247)').attr('stop-opacity', 1);

    // let gradient_pro = defs.append('svg:pattern')
    //   .attr('id', 'gradient_link')
    //   .attr('x', 0).attr('y', 0)
    //   .attr('patternUnits', 'userSpaceOnUse')
    //   .attr('height', '100%')
    //   .attr('width', '100%')
    //   .append('svg:image')
    //   .attr('y', 0).attr('x', 0)
    //   .attr('xlink:href', './public/image/gradient_link.svg')
    //   .attr('width', '100%')
    //   .attr('height', '100%');

    // Creación de Links
    path = sankeyChartD3.link();
    //  Se crean links
    let link = chart.append('g')
      .attr('id', 'links')
      .selectAll('.link')
      .data(sankeyChartD3.links())
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'link')
      .style('stroke-width', (d) => Math.max(1, d.dy));
    link.filter((element) => (element.source.id === 42)).style('stroke', 'url(#gradient_imp_default)');
    link.filter((element) => (element.target.id === 43)).style('stroke', 'url(#gradient_exp_default)');
    // Se crean nodos
    let node = chart.append('g')
      .attr('id', 'nodes')
      .selectAll('.node')
      .data(sankeyChartD3.nodes())
      .enter()
      .append('g')
        .attr('id', (d) => `node_${ d.id }`)
        .attr('class', 'node')
        .attr('transform', (d) => {
          if (posColumnas.indexOf(d.x) === -1) {
            posColumnas.push(d.x);
          }
          return `translate(${ d.x }, ${ d.y })`;
        }) // error compatibilidad
        .on('click', (d) => {
          console.log('click');
        });
    // Se crean rectangulos nodos
    node.filter((element) => (element.nombre !== 'borrar' && element.oferta_interna > 0 || typeof(element.oferta_interna) === 'undefined')).append('rect')
        .attr('width', sankeyChartD3.nodeWidth())
        .attr('height', (d) => (Math.max(5, d.dy)))
        .on('mouseenter',  fade('fadeIn', null))
        .on('mouseleave',   fade('fadeOut', null));
    // Se crean textos nodos
    node.filter((element) => (element.nombre !== 'borrar' && element.oferta_interna > 0 || typeof(element.oferta_interna) === 'undefined')).append('text')
      .attr('class', 'node-text')
      .attr('x', 10 + sankeyChartD3.nodeWidth())
      .attr('y', (d) => (d.dy / 2))
      .attr('dy', '0.35em')
      .text((d) => (d.nombre))
      .filter((d) => (d.targetLinks.length === 0))
      .attr('class', 'node-text-start')
      .attr('x', -10);
    // Se agregan encabezados
    posColumnas.sort((a, b) => (a - b)); // Se ordena posicion de columnas
    SANKEY.secciones_header.forEach((v, k) => {
      encabezado.append('text')
        .filter((d) => (k > 0))
        .attr('class', 'chart-encabezado-right')
        .attr('x', (d) => (posColumnas[k] + anchoNodo + 10))
        .text(v[0]);
      encabezado.append('text')
        .filter((d) => (k > 0))
        .attr('class', 'chart-encabezado-right')
        .attr('x', (d) => (posColumnas[k] + anchoNodo + 10))
        .attr('y', 19)
        .text(v[1]);
    });
  };
  const calcularAltura = (reset = false) => {
    height  = $('#sankey').height();
    width   = $('#sankey').width();

    if (reset) {
      $('#sankey').empty();
    }

    if (($('#content h1').outerHeight() + $('#content form').outerHeight() + 550) <= $('#content').outerHeight()) {
      d3.select('#content').attr('style', null);
      SANKEY.margin.bottom  = 40;
      SANKEY.margin.left    = 200;
      SANKEY.margin.top     = 40;
      SANKEY.margin.header  = 20;
      SANKEY.anchoNodo      = 20;
      SANKEY.separacionNodo = 20;
    } else {
      d3.select('#content').attr('style', 'height: 100%');
      SANKEY.margin.bottom  = 5;
      SANKEY.margin.left    = 150;
      SANKEY.margin.top     = 20;
      SANKEY.margin.header  = 15;
      SANKEY.anchoNodo      = 10;
      SANKEY.separacionNodo = 15;
    }

    if (reset) {
      dibujarSankey(width, height, { 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS }, { margin: SANKEY.margin, separacionNodo: SANKEY.separacionNodo, anchoNodo: SANKEY.anchoNodo });
    }
  };
  const setearNodosYLinks = () => {
    allLinks = d3.selectAll('#sankey .link');
    allNodes = d3.selectAll('#sankey .node');

    return true;
  };

  downloadFile(2015)
    .then(() => obtenerNodosIntro())
    .then(() => calcularAltura())
    .then(() => dibujarSankey(width, height, { 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS }, { margin: SANKEY.margin, separacionNodo: SANKEY.separacionNodo, anchoNodo: SANKEY.anchoNodo }))
    .then(() => setearNodosYLinks())
    .then(() => intro(0, 'create', 'next'))
    .then(() => {
      // Eventos

      // Selector años
      for (let i = 2015; i > 1959; i--) { $('select[name=anio]').append(`<option value="${ i }">${ i }</option>`); }
      $('select[name=anio]').on('change', (event) => {
        downloadFile($('select[name=anio]')[0].value)
          .then(() => setearNodosYLinks())
          .then(() => calcularAltura(true));
      });

      // Altura contenedor Sankey
      $(window).on('resize', () => {
        calcularAltura(true);
      });
  });
});

// ===== VERIDIA CHARTS — SVG inline graphs (zero dependencies) =====

/**
 * Line/Area chart — ideal for weight evolution, trends
 * @param {Object} opts - {data:[{label,value}], width, height, color, fill, unit, title, yMin, yMax}
 * @returns {string} SVG markup
 */
function svgLineChart(opts){
  var data=opts.data||[];if(data.length<2)return '<div style="text-align:center;color:var(--text3);font-size:.78rem;padding:20px">Mínimo 2 puntos de datos</div>';
  var W=opts.width||480,H=opts.height||180,pad={t:25,r:15,b:35,l:45};
  var color=opts.color||'var(--primary)',fill=opts.fill!==false;
  var vals=data.map(function(d){return d.value});
  var mn=opts.yMin!==undefined?opts.yMin:Math.min.apply(null,vals),mx=opts.yMax!==undefined?opts.yMax:Math.max.apply(null,vals);
  var range=mx-mn||1;mn-=range*0.1;mx+=range*0.1;range=mx-mn;
  var iW=(W-pad.l-pad.r)/(data.length-1),iH=H-pad.t-pad.b;

  var points=data.map(function(d,i){return{x:pad.l+i*iW,y:pad.t+iH-(d.value-mn)/range*iH}});
  var pathD=points.map(function(p,i){return(i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1)}).join(' ');
  var areaD=pathD+' L'+points[points.length-1].x.toFixed(1)+','+(pad.t+iH)+' L'+points[0].x.toFixed(1)+','+(pad.t+iH)+' Z';

  // Y axis labels (5 ticks)
  var yLabels='';
  for(var t=0;t<5;t++){
    var yVal=mn+range*t/4;var yPos=pad.t+iH-t/4*iH;
    yLabels+='<text x="'+(pad.l-6)+'" y="'+(yPos+3)+'" fill="var(--text3)" font-size="9" text-anchor="end">'+Math.round(yVal*10)/10+'</text>';
    yLabels+='<line x1="'+pad.l+'" y1="'+yPos+'" x2="'+(W-pad.r)+'" y2="'+yPos+'" stroke="var(--border)" stroke-width=".5" stroke-dasharray="3,3"/>';
  }

  // X axis labels
  var xLabels=data.map(function(d,i){
    var skip=data.length>10?Math.ceil(data.length/8):1;
    if(i%skip!==0&&i!==data.length-1)return'';
    return'<text x="'+points[i].x+'" y="'+(H-5)+'" fill="var(--text3)" font-size="9" text-anchor="middle">'+d.label+'</text>';
  }).join('');

  // Dots + tooltips
  var dots=points.map(function(p,i){
    return'<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="4" fill="'+color+'" stroke="#fff" stroke-width="2" style="cursor:pointer"><title>'+data[i].label+': '+data[i].value+(opts.unit||'')+'</title></circle>';
  }).join('');

  // Value labels on dots
  var valLabels=points.map(function(p,i){
    var skip=data.length>8?Math.ceil(data.length/6):1;
    if(i%skip!==0&&i!==data.length-1)return'';
    return'<text x="'+p.x.toFixed(1)+'" y="'+(p.y-10)+'" fill="'+color+'" font-size="9" font-weight="700" text-anchor="middle">'+data[i].value+'</text>';
  }).join('');

  var title=opts.title?'<text x="'+W/2+'" y="14" fill="var(--text2)" font-size="11" font-weight="700" text-anchor="middle">'+opts.title+'</text>':'';

  return'<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:'+W+'px;font-family:Inter,system-ui,sans-serif">'+title+yLabels+xLabels
    +(fill?'<path d="'+areaD+'" fill="'+color+'" opacity=".1"/>':'')
    +'<path d="'+pathD+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    +dots+valLabels+'</svg>';
}

/**
 * Bar chart — ideal for income, distribution, counts
 * @param {Object} opts - {data:[{label,value,color}], width, height, color, unit, title, horizontal}
 * @returns {string} SVG markup
 */
function svgBarChart(opts){
  var data=opts.data||[];if(!data.length)return'';
  var W=opts.width||480,H=opts.height||180,pad={t:25,r:15,b:35,l:45};
  var color=opts.color||'var(--primary)';
  var vals=data.map(function(d){return d.value});
  var mx=Math.max.apply(null,vals)||1;
  var iW=(W-pad.l-pad.r)/data.length,barW=Math.min(iW*0.7,40),iH=H-pad.t-pad.b;

  // Y axis
  var yLabels='';
  for(var t=0;t<5;t++){
    var yVal=mx*t/4;var yPos=pad.t+iH-t/4*iH;
    yLabels+='<text x="'+(pad.l-6)+'" y="'+(yPos+3)+'" fill="var(--text3)" font-size="9" text-anchor="end">'+Math.round(yVal)+'</text>';
    yLabels+='<line x1="'+pad.l+'" y1="'+yPos+'" x2="'+(W-pad.r)+'" y2="'+yPos+'" stroke="var(--border)" stroke-width=".5" stroke-dasharray="3,3"/>';
  }

  var bars=data.map(function(d,i){
    var barH=Math.max(d.value/mx*iH,2);
    var x=pad.l+i*iW+(iW-barW)/2;
    var y=pad.t+iH-barH;
    var c=d.color||color;
    return'<rect x="'+x+'" y="'+y+'" width="'+barW+'" height="'+barH+'" rx="3" fill="'+c+'" opacity=".85"><title>'+d.label+': '+d.value+(opts.unit||'')+'</title></rect>'
      +'<text x="'+(x+barW/2)+'" y="'+(y-5)+'" fill="'+c+'" font-size="9" font-weight="700" text-anchor="middle">'+(d.value||'')+'</text>'
      +'<text x="'+(x+barW/2)+'" y="'+(H-5)+'" fill="var(--text3)" font-size="8" text-anchor="middle">'+d.label+'</text>';
  }).join('');

  var title=opts.title?'<text x="'+W/2+'" y="14" fill="var(--text2)" font-size="11" font-weight="700" text-anchor="middle">'+opts.title+'</text>':'';

  return'<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:'+W+'px;font-family:Inter,system-ui,sans-serif">'+title+yLabels+bars+'</svg>';
}

/**
 * Donut chart — ideal for macro distribution, percentages
 * @param {Object} opts - {data:[{label,value,color}], size, title, unit}
 * @returns {string} SVG markup
 */
function svgDonutChart(opts){
  var data=opts.data||[];if(!data.length)return'';
  var S=opts.size||160,cx=S/2,cy=S/2,R=S*0.38,r=S*0.24;
  var total=data.reduce(function(s,d){return s+d.value},0);if(!total)return'';
  var angle=-90,paths='',legends='';
  var colors=['var(--accent)','#f59e0b','var(--success)','var(--info)','#8b5cf6','#ef4444'];

  data.forEach(function(d,i){
    var pct=d.value/total;var sweep=pct*360;
    var a1=angle*Math.PI/180,a2=(angle+sweep)*Math.PI/180;
    var x1=cx+R*Math.cos(a1),y1=cy+R*Math.sin(a1);
    var x2=cx+R*Math.cos(a2),y2=cy+R*Math.sin(a2);
    var ix1=cx+r*Math.cos(a1),iy1=cy+r*Math.sin(a1);
    var ix2=cx+r*Math.cos(a2),iy2=cy+r*Math.sin(a2);
    var large=sweep>180?1:0;
    var c=d.color||colors[i%colors.length];
    paths+='<path d="M'+x1+','+y1+' A'+R+','+R+' 0 '+large+',1 '+x2+','+y2+' L'+ix2+','+iy2+' A'+r+','+r+' 0 '+large+',0 '+ix1+','+iy1+' Z" fill="'+c+'" opacity=".9"><title>'+d.label+': '+d.value+(opts.unit||'')+' ('+Math.round(pct*100)+'%)</title></path>';
    legends+='<div style="display:flex;align-items:center;gap:6px;font-size:.72rem"><div style="width:10px;height:10px;border-radius:2px;background:'+c+'"></div><span style="color:var(--text2)">'+d.label+'</span><strong>'+d.value+(opts.unit||'')+'</strong><span style="color:var(--text3)">('+Math.round(pct*100)+'%)</span></div>';
    angle+=sweep;
  });

  // Center text
  var centerText=opts.title?'<text x="'+cx+'" y="'+(cy-3)+'" fill="var(--text3)" font-size="9" text-anchor="middle">'+opts.title+'</text><text x="'+cx+'" y="'+(cy+12)+'" fill="var(--text)" font-size="16" font-weight="800" text-anchor="middle">'+total+(opts.unit||'')+'</text>':'';

  return'<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><svg viewBox="0 0 '+S+' '+S+'" width="'+S+'" height="'+S+'" style="font-family:Inter,system-ui,sans-serif">'+paths+centerText+'</svg><div style="display:flex;flex-direction:column;gap:4px">'+legends+'</div></div>';
}

(() => {
    const advSvg = d3.select("#advanced-chart");
    if (advSvg.empty()) {
        return;
    }

    const advWidth = 1100;
    const advHeight = 620;
    const advMargin = { top: 70, right: 35, bottom: 70, left: 100 };
    const innerWidth = advWidth - advMargin.left - advMargin.right;
    const innerHeight = advHeight - advMargin.top - advMargin.bottom;

    advSvg
        .attr("viewBox", `0 0 ${advWidth} ${advHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const root = advSvg.append("g")
        .attr("transform", `translate(${advMargin.left},${advMargin.top})`);

    const tooltip = d3.select("#adv-tooltip");
    const vizButtons = d3.selectAll(".viz-btn");
    const metricButtons = d3.selectAll(".metric-btn");
    const yearSelect = d3.select("#viz-year-select");
    const yearRow = d3.select(".year-row");

    const state = {
        activeViz: "viz1",
        activeMetric: "arrests",
        selectedYear: null,
        streamFocusCountry: null,
        data: null,
    };

    const METRIC_LABELS = {
        arrests: "Administrative Arrests",
        detentions: "Detentions",
        removals: "Removals",
    };

    function metricLabel(metric) {
        return METRIC_LABELS[metric] || metric;
    }

    function showTooltip(event, html) {
        tooltip
            .classed("hidden", false)
            .html(html);
        moveTooltip(event);
    }

    function moveTooltip(event) {
        tooltip
            .style("left", `${event.clientX + 14}px`)
            .style("top", `${event.clientY + 14}px`);
    }

    function hideTooltip() {
        tooltip.classed("hidden", true);
    }

    function clearCanvas() {
        advSvg.on(".zoom", null);
        root.selectAll("*").remove();
    }

    function updateButtonState() {
        vizButtons.classed("active", function () {
            return d3.select(this).attr("data-viz") === state.activeViz;
        });
        metricButtons.classed("active", function () {
            return d3.select(this).attr("data-metric") === state.activeMetric;
        });

        const needsYear = state.activeViz === "viz2" || state.activeViz === "viz3";
        yearRow.style("display", needsYear ? "flex" : "none");
    }

    function drawFrame(title, subtitle) {
        root.append("text")
            .attr("class", "adv-title")
            .attr("x", 0)
            .attr("y", -30)
            .text(title);

        root.append("text")
            .attr("class", "adv-subtitle")
            .attr("x", 0)
            .attr("y", -10)
            .text(subtitle);
    }

    function drawNotice(title, message) {
        drawFrame(title, message);
        root.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight / 2)
            .attr("fill", "#f0dce8")
            .attr("font-size", 16)
            .attr("text-anchor", "middle")
            .text(message);
    }

    function formatNumber(num) {
        return d3.format(",")(num || 0);
    }

    function getYearlySeries(metricKey) {
        if (metricKey === "arrests") {
            return state.data.yearlyArrests;
        }
        if (metricKey === "detentions") {
            return state.data.yearlyDetentions;
        }
        return state.data.yearlyRemovals;
    }

    function renderViz1() {
        const source = getYearlySeries(state.activeMetric);
        const data = source.map(d => ({
            year: +d["Fiscal Year"],
            total: +d.total,
        }));

        drawFrame(
            "Viz 1: Counted Bodies, Counted Years",
            `Icon chart of yearly ${metricLabel(state.activeMetric).toLowerCase()} totals`
        );

        const chart = root.append("g");
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, innerWidth])
            .padding(0.23);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total) * 1.08])
            .range([innerHeight, 0]);

        chart.append("g")
            .attr("class", "adv-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        chart.append("g")
            .attr("class", "adv-axis")
            .call(d3.axisLeft(y).ticks(6));

        chart.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 52)
            .attr("fill", "#f2dce8")
            .attr("text-anchor", "middle")
            .text("Fiscal Year");

        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -70)
            .attr("fill", "#f2dce8")
            .attr("text-anchor", "middle")
            .text(metricLabel(state.activeMetric));

        const iconValue = 4200;
        const iconSize = 30;
        let iconsPerRow = 5;
        const iconPad = 2;

        if (state.activeMetric === "arrests") {
            iconsPerRow = 3;
        }

        const iconData = [];
        const topDots = [];
        

        data.forEach(d => {
            const iconCount = Math.max(1, Math.floor(d.total / iconValue));
            const rowCount = Math.ceil(iconCount / iconsPerRow);
            
            const topY = innerHeight - rowCount * (iconSize + iconPad) - 8;
            topDots.push({ year: d.year, y: topY });

            for (let i = 0; i < iconCount; i += 1) {
                iconData.push({
                year: d.year,
                col: i % iconsPerRow,
                row: Math.floor(i / iconsPerRow),
                iconsPerRow,
                });
            }
        });

        chart.selectAll(".viz1-person")
            .data(iconData, d => `${d.year}-${d.col}-${d.row}`)
            .enter()
            .append("image")
            .attr("class", "viz1-person")
            .attr("href", "info-vis-project/assets/person.svg")
            .attr("width", iconSize)
            .attr("height", iconSize)
            .attr("x", d => x(d.year) + 
            (x.bandwidth() - iconsPerRow * iconSize) / 2 + d.col * iconSize)
            .attr("y", innerHeight - 30)
            .attr("opacity", 0.86)
            .transition()
            .duration(700)
            .delay((d, i) => (i % 15) * 14)
            .attr("y", d => innerHeight - (d.row + 1) * (iconSize + iconPad));

        const linePoints = topDots.map(d => ({
            year: d.year,
            x: x(d.year) + x.bandwidth() / 2,
            y: d.y,
        }));

        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        const path = chart.append("path")
            .datum(linePoints)
            .attr("fill", "none")
            .attr("stroke", "none")
            .attr("d", line);

        const pathNode = path.node();
        if (pathNode) {
            const totalLength = pathNode.getTotalLength();
            const chainPoints = d3.range(0, totalLength, 20).map(len => {
                const p = pathNode.getPointAtLength(len);
                const next = pathNode.getPointAtLength(Math.min(len + 1, totalLength));
                return {
                    x: p.x,
                    y: p.y,
                    angle: Math.atan2(next.y - p.y, next.x - p.x),
                };
            });

            chart.selectAll(".viz1-chain")
                .data(chainPoints)
                .enter()
                .append("image")
                .attr("class", "viz1-chain")
                .attr("href", "info-vis-project/assets/chains.svg")
                .attr("width", 18)
                .attr("height", 18)
                .attr("opacity", 0.84)
                .attr("transform", d => `
                    translate(${d.x}, ${d.y})
                    rotate(${(d.angle * 180) / Math.PI})
                    translate(-9,-9)
                `);
        }

        chart.selectAll(".viz1-dot")
            .data(topDots)
            .enter()
            .append("circle")
            .attr("class", "viz1-dot")
            .attr("cx", d => x(d.year) + x.bandwidth() / 2)
            .attr("cy", d => d.y)
            .attr("r", 0)
            .attr("fill", "#ffe2e8")
            .transition()
            .duration(500)
            .delay(300)
            .attr("r", 5.5);

        chart.selectAll(".viz1-hit")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "viz1-hit")
            .attr("x", d => x(d.year))
            .attr("y", 0)
            .attr("width", x.bandwidth())
            .attr("height", innerHeight)
            .attr("fill", "transparent")
            .on("mousemove", (event, d) => {
                showTooltip(
                    event,
                    `<strong>Fiscal Year ${d.year}</strong><br/>${metricLabel(state.activeMetric)}: ${formatNumber(d.total)}`
                );
            })
            .on("mouseleave", hideTooltip);
    } 

    function renderViz2() {
        if (!state.data.usTopology || !state.data.usTopology.objects || !state.data.usTopology.objects.states) {
            drawNotice(
                "Viz 2: AOR Geography (United States)",
                "US map data is unavailable right now. Check internet and refresh."
            );
            return;
        }

        drawFrame(
            "Viz 2: AOR Geography (United States)",
            `${metricLabel(state.activeMetric)} by Area of Responsibility in FY ${state.selectedYear}`
        );

        const mapGroup = root.append("g");
        const states = topojson.feature(state.data.usTopology, state.data.usTopology.objects.states);
        const projection = d3.geoAlbersUsa().fitSize([innerWidth, innerHeight], states);
        const path = d3.geoPath(projection);

        mapGroup.selectAll(".us-state")
            .data(states.features)
            .enter()
            .append("path")
            .attr("class", "us-state")
            .attr("d", path)
            .attr("fill", "#2a2430")
            .attr("stroke", "#5f5168")
            .attr("stroke-width", 0.8);

        const yearRows = state.data.aorData.records.filter(d => +d.fiscal_year === +state.selectedYear);
        const withCoords = yearRows
            .map(d => {
                const point = projection([+d.lng, +d.lat]);
                if (!point) {
                    return null;
                }
                return {
                    ...d,
                    x: point[0],
                    y: point[1],
                    value: +d[state.activeMetric],
                };
            })
            .filter(Boolean);

        const maxValue = d3.max(withCoords, d => d.value) || 1;
        const radius = d3.scaleSqrt().domain([0, maxValue]).range([4, 34]);

        mapGroup.selectAll(".aor-bubble")
            .data(withCoords, d => d.aor)
            .enter()
            .append("circle")
            .attr("class", "aor-bubble")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 0)
            .attr("fill", "rgba(255, 116, 86, 0.65)")
            .attr("stroke", "#ffd3c7")
            .attr("stroke-width", 1.2)
            .on("mousemove", (event, d) => {
                const topCountries = (d.top_countries || [])
                    .map(item => `${item.country} (${formatNumber(item.total)})`)
                    .join("<br/>");
                showTooltip(
                    event,
                    `<strong>${d.aor}</strong><br/>${metricLabel(state.activeMetric)}: ${formatNumber(d.value)}<br/>` +
                    `Detentions: ${formatNumber(d.detentions)}<br/>Removals: ${formatNumber(d.removals)}<br/>Arrests: ${formatNumber(d.arrests)}` +
                    (topCountries ? `<br/><br/><em>Top countries</em><br/>${topCountries}` : "")
                );
            })
            .on("mouseleave", hideTooltip)
            .transition()
            .duration(800)
            .attr("r", d => radius(d.value));

        const legendX = innerWidth - 220;
        const legendY = innerHeight - 140;
        const legendValues = [maxValue * 0.25, maxValue * 0.6, maxValue].map(v => Math.round(v));

        const legend = mapGroup.append("g")
            .attr("transform", `translate(${legendX},${legendY})`);

        legend.append("text")
            .attr("fill", "#f3dde6")
            .attr("font-size", 12)
            .text(metricLabel(state.activeMetric));

        legend.selectAll(".legend-bubble")
            .data(legendValues)
            .enter()
            .append("circle")
            .attr("cx", 35)
            .attr("cy", d => 52 - radius(d))
            .attr("r", d => radius(d))
            .attr("fill", "none")
            .attr("stroke", "#dcb9c4")
            .attr("stroke-dasharray", "3,3");

        legend.selectAll(".legend-label")
            .data(legendValues)
            .enter()
            .append("text")
            .attr("x", 76)
            .attr("y", d => 56 - 2 * radius(d))
            .attr("fill", "#e5cfdb")
            .attr("font-size", 11)
            .text(d => formatNumber(d));
    }

    function renderViz3() {
        if (
            !state.data.worldTopology ||
            !state.data.worldTopology.objects ||
            !state.data.worldTopology.objects.countries
        ) {
            drawNotice(
                "Viz 3: Country of Citizenship (World Choropleth)",
                "World map data is unavailable right now. Check internet and refresh."
            );
            return;
        }

        drawFrame(
            "Viz 3: Country of Citizenship (World Choropleth)",
            `${metricLabel(state.activeMetric)} by country in FY ${state.selectedYear}`
        );

        const mapGroup = root.append("g");
        const countries = topojson.feature(state.data.worldTopology, state.data.worldTopology.objects.countries);
        const projection = d3.geoNaturalEarth1().fitSize([innerWidth, innerHeight], countries);
        const path = d3.geoPath(projection);

        const nameById = new Map(
            state.data.countryData.records
                .filter(d => d.iso_numeric)
                .map(d => [String(d.iso_numeric).padStart(3, "0"), d.country_normalized || d.country])
        );
        const rows = state.data.countryData.records.filter(d => +d.fiscal_year === +state.selectedYear && d.iso_numeric);
        const dataById = new Map(rows.map(d => [String(d.iso_numeric).padStart(3, "0"), d]));
        const values = rows
            .map(d => +d[state.activeMetric])
            .filter(v => Number.isFinite(v) && v > 0)
            .sort(d3.ascending);
        const q98 = values.length > 0 ? d3.quantile(values, 0.98) : 1;
        const colorCap = Math.max(1, q98 || 1);
        const logMin = Math.log1p(1);
        const logMax = Math.log1p(colorCap);
        const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([logMin, logMax]);

        mapGroup.selectAll(".world-country")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("class", "world-country")
            .attr("d", path)
            .attr("fill", d => {
                const key = String(d.id).padStart(3, "0");
                const rec = dataById.get(key);
                if (!rec) {
                    return "#2a2530";
                }
                const rawValue = +rec[state.activeMetric];
                if (!rawValue || rawValue <= 0) {
                    return "#2a2530";
                }
                const capped = Math.min(rawValue, colorCap);
                return color(Math.log1p(capped));
            })
            .attr("stroke", "#6f6078")
            .attr("stroke-width", 0.5)
            .on("mousemove", (event, feature) => {
                const key = String(feature.id).padStart(3, "0");
                const rec = dataById.get(key);
                const countryName = nameById.get(key) || "Unknown country";

                if (!rec) {
                    showTooltip(event, `<strong>${countryName}</strong><br/>No available data for this year.`);
                    return;
                }

                showTooltip(
                    event,
                    `<strong>${countryName}</strong><br/>${metricLabel(state.activeMetric)}: ${formatNumber(rec[state.activeMetric])}<br/>` +
                    `Detentions: ${formatNumber(rec.detentions)}<br/>Removals: ${formatNumber(rec.removals)}<br/>Arrests: ${formatNumber(rec.arrests)}`
                );
            })
            .on("mouseleave", hideTooltip);

        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", event => {
                mapGroup.attr("transform", event.transform);
            });

        advSvg.call(zoom);

        root.append("text")
            .attr("x", innerWidth - 220)
            .attr("y", innerHeight + 24)
            .attr("fill", "#d2bac9")
            .attr("font-size", 12)
            .text("Scroll to zoom, drag to pan");
    }

    function renderViz4() {
        drawFrame(
            "Viz 4: Rivers of Movement",
            `Top-10 countries by total activity, layered by year (${metricLabel(state.activeMetric)})`
        );

        const payload = state.data.streamData;
        const years = payload.years.map(Number);
        const countries = payload.top_countries;
        const metric = state.activeMetric;

        const rowMap = new Map(years.map(y => [y, { fiscal_year: y }]));
        payload.records.forEach(r => {
            const year = +r.fiscal_year;
            const row = rowMap.get(year);
            if (!row) {
                return;
            }
            row[r.country] = +r[metric];
        });

        const stackRows = years.map(y => {
            const row = rowMap.get(y);
            countries.forEach(c => {
                if (!Object.prototype.hasOwnProperty.call(row, c)) {
                    row[c] = 0;
                }
            });
            return row;
        });

        const stacked = d3.stack()
            .keys(countries)
            .offset(d3.stackOffsetWiggle)
            (stackRows);

        const x = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(stacked, s => d3.min(s, d => d[0])),
                d3.max(stacked, s => d3.max(s, d => d[1])),
            ])
            .range([innerHeight, 0]);

        const color = d3.scaleOrdinal()
            .domain(countries)
            .range([
                "#f26b8a", "#ff8c55", "#ffc857", "#7dd3fc", "#b594f9",
                "#8ed081", "#f78fb3", "#79c2d0", "#e7a977", "#cf7db2",
            ]);

        const area = d3.area()
            .curve(d3.curveCatmullRom.alpha(0.5))
            .x((d, i) => x(years[i]))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        const focused = state.streamFocusCountry;

        root.selectAll(".stream-layer")
            .data(stacked, d => d.key)
            .enter()
            .append("path")
            .attr("class", "stream-layer")
            .attr("d", area)
            .attr("fill", d => color(d.key))
            .attr("stroke", "rgba(255,255,255,0.18)")
            .attr("stroke-width", 0.7)
            .attr("opacity", d => (!focused || focused === d.key ? 0.92 : 0.12))
            .on("mousemove", (event, d) => {
                const countryTotal = payload.records
                    .filter(r => r.country === d.key)
                    .reduce((sum, r) => sum + (+r[metric]), 0);
                showTooltip(
                    event,
                    `<strong>${d.key}</strong><br/>${metricLabel(metric)} total: ${formatNumber(countryTotal)}<br/>Click to isolate`
                );
            })
            .on("mouseleave", hideTooltip)
            .on("click", (_, d) => {
                state.streamFocusCountry = state.streamFocusCountry === d.key ? null : d.key;
                render();
            });

        root.append("g")
            .attr("class", "adv-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format("d")));

        root.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 50)
            .attr("text-anchor", "middle")
            .attr("fill", "#f2dce8")
            .text("Fiscal Year");

        const legend = root.append("g")
            .attr("transform", `translate(${innerWidth - 180},15)`);

        legend.selectAll(".legend-chip")
            .data(countries)
            .enter()
            .append("g")
            .attr("class", "legend-chip")
            .attr("transform", (_, i) => `translate(0,${i * 18})`)
            .on("click", (_, country) => {
                state.streamFocusCountry = state.streamFocusCountry === country ? null : country;
                render();
            })
            .each(function (country) {
                const chip = d3.select(this);
                chip.append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("rx", 2)
                    .attr("fill", color(country))
                    .attr("opacity", !focused || focused === country ? 1 : 0.3);
                chip.append("text")
                    .attr("x", 16)
                    .attr("y", 9)
                    .attr("fill", "#f4e6ee")
                    .attr("font-size", 11)
                    .text(country);
            });
    }

    function render() {
        if (!state.data) {
            return;
        }

        hideTooltip();
        updateButtonState();
        clearCanvas();


        if (state.activeViz == "viz1") {
            renderViz1();
        } else if (state.activeViz === "viz2") {
            renderViz2();
        } else if (state.activeViz === "viz3") {
            renderViz3();
        } else if (state.activeViz === "viz4") {
            renderViz4();
        } else {
            renderViz1();
        }
    }

    function bindControls() {
        vizButtons.on("click", function () {
            state.activeViz = d3.select(this).attr("data-viz");
            if (state.activeViz !== "viz4") {
                state.streamFocusCountry = null;
            }
            render();
        });

        metricButtons.on("click", function () {
            state.activeMetric = d3.select(this).attr("data-metric");
            render();
        });

        yearSelect.on("change", function () {
            state.selectedYear = +this.value;
            render();
        });
    }

    function loadJsonWithFallback(localPath, remotePath, label) {
        return d3.json(localPath).catch(localErr => {
            console.warn(`Unable to load local ${label} at ${localPath}; falling back to CDN.`, localErr);
            return d3.json(remotePath);
        });
    }

    bindControls();

    Promise.all([
        d3.json("info-vis-project/data/arrests_yearly.json"),
        d3.json("info-vis-project/data/detentions_yearly.json"),
        d3.json("info-vis-project/data/removals_yearly.json"),
        d3.json("info-vis-project/data/aor_data.json"),
        d3.json("info-vis-project/data/country_data.json"),
        d3.json("info-vis-project/data/country_yearly.json"),
    ]).then(([
        yearlyArrests,
        yearlyDetentions,
        yearlyRemovals,
        aorData,
        countryData,
        streamData,
    ]) => {
        state.data = {
            yearlyArrests,
            yearlyDetentions,
            yearlyRemovals,
            aorData,
            countryData,
            streamData,
            usTopology: null,
            worldTopology: null,
        };

        const years = (countryData.years || []).slice().sort((a, b) => a - b);
        if (years.length > 0) {
            state.selectedYear = years[years.length - 1];
        }

        yearSelect.selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
        if (state.selectedYear !== null) {
            yearSelect.property("value", state.selectedYear);
        }
        render();

        return Promise.allSettled([
            loadJsonWithFallback(
                "info-vis-project/data/maps/us-states-10m.json",
                "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
                "US topology"
            ),
            loadJsonWithFallback(
                "info-vis-project/data/maps/world-countries-110m.json",
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
                "world topology"
            ),
        ]);
    }).then(results => {
        if (!results || !state.data) {
            return;
        }

        const [usRes, worldRes] = results;
        if (usRes.status === "fulfilled") {
            state.data.usTopology = usRes.value;
        } else {
            console.warn("Unable to load US topology:", usRes.reason);
        }

        if (worldRes.status === "fulfilled") {
            state.data.worldTopology = worldRes.value;
        } else {
            console.warn("Unable to load world topology:", worldRes.reason);
        }

        if (state.activeViz === "viz2" || state.activeViz === "viz3") {
            render();
        }
    }).catch(error => {
        console.error("Failed to load base advanced visualization data:", error);
        clearCanvas();
        drawNotice("Visualization Unavailable", "Core data failed to load. Check local JSON files and refresh.");
    });
})();

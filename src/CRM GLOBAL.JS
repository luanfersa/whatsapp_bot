var waRefreshInterval = null;
function waHashColor(e) {
  for (
    var a = [
        "#3b82f6",
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#06b6d4",
        "#ec4899",
        "#14b8a6",
        "#f97316",
        "#6366f1",
      ],
      t = 0,
      n = 0;
    n < e.length;
    n++
  )
    ((t = e.charCodeAt(n) + ((t << 5) - t)), (t |= 0));
  return a[Math.abs(t) % a.length];
}
function waUpdateChips(e, a, t) {
  var n = document.getElementById("chipEstado"),
    o = document.getElementById("chipAsignado"),
    i = document.getElementById("chipTipo");
  if (n) {
    var s =
      (s = {
        ACTIVA: {
          cls: "wa-chip-green",
          icon: "ti-circle-check",
          txt: "Activa",
        },
        PENDIENTE: { cls: "wa-chip-amber", icon: "ti-clock", txt: "Pendiente" },
        CERRADA: { cls: "wa-chip-gray", icon: "ti-circle-x", txt: "Cerrada" },
      })[e] || s.ACTIVA;
    ((n.className = "wa-chip " + s.cls),
      (n.innerHTML = '<i class="ti ' + s.icon + '"></i>' + s.txt),
      a && "SIN ASIGNAR" !== a
        ? ((o.className = "wa-chip wa-chip-purple"),
          (o.innerHTML = '<i class="ti ti-user-check"></i>' + a))
        : ((o.className = "wa-chip wa-chip-amber"),
          (o.innerHTML = '<i class="ti ti-user-off"></i>Sin asignar')),
      (i.style.display = ""));
    try {
      var r,
        c,
        d = t.split("/");
      3 === d.length &&
        ((r = new Date(d[2], d[1] - 1, d[0])),
        (c = (new Date() - r) / 864e5) < 2
          ? ((i.className = "wa-chip wa-chip-blue"),
            (i.innerHTML = '<i class="ti ti-sparkles"></i>Cliente nuevo'))
          : c < 7
            ? ((i.className = "wa-chip wa-chip-blue"),
              (i.innerHTML = '<i class="ti ti-repeat"></i>Recurrente'))
            : (i.style.display = "none"));
    } catch (e) {
      i.style.display = "none";
    }
  }
}
function waUpdateWhatsAppLink(e) {
  var a = document.getElementById("spWhatsAppLink");
  a && ((e = e.replace(/[\s\-\+]/g, "")), (a.href = "https://wa.me/" + e));
}
function waCharCounter() {
  var e = document.getElementById("waTextarea"),
    a = document.getElementById("waCharCount");
  e &&
    a &&
    e.addEventListener("input", function () {
      var e = this.value.length;
      ((a.textContent = e + "/2000"),
        (a.style.color = 1800 < e ? "#ef4444" : "#94a3b8"));
    });
}
function waSetFiltrosCounts(e, a, t, n) {
  var o = document.getElementById("fcTodas"),
    i = document.getElementById("fcNoleidas"),
    s = document.getElementById("fcBot"),
    r = document.getElementById("fcAsignadas"),
    c = document.getElementById("waConvCountBadge");
  (o && (o.textContent = e),
    i && (i.textContent = a),
    s && (s.textContent = t),
    r && (r.textContent = n),
    c && (c.textContent = e),
    i && (i.style.display = 0 < a ? "" : "none"),
    s && (s.style.display = 0 < t ? "" : "none"),
    r && (r.style.display = 0 < n ? "" : "none"));
}
function waUpdateFiltrosCounts() {
  var e = document.querySelectorAll(".wa-conv-item"),
    a = e.length,
    t = 0,
    n = 0,
    o = 0;
  (e.forEach(function (e) {
    (e.querySelector(".wa-unread-badge") && t++,
      e.dataset.asignado && 0 === e.dataset.asignado.indexOf("BOT") && n++,
      e.dataset.asignado && "SIN ASIGNAR" !== e.dataset.asignado && o++);
  }),
    waSetFiltrosCounts(a, t, n, o));
}
function waUpdateDayStats(e, a, t) {
  void 0 === e &&
    ((e = (n = document.querySelectorAll(".wa-conv-item")).length),
    (t = a = 0),
    n.forEach(function (e) {
      ("CERRADA" === (e = (e.dataset.estado || "").toUpperCase()) && a++,
        "PENDIENTE" === e && t++);
    }));
  var n = document.getElementById("dsTotalConv"),
    o = document.getElementById("dsResueltas"),
    i = document.getElementById("dsPendientes");
  (n && (n.textContent = e),
    o && (o.textContent = a),
    i && (i.textContent = t));
}
function waUpdateMetricas(e) {
  ["metMensajes", "metNotas", "metAdjuntos", "metPlantillas"].forEach(
    function (e) {
      (e = document.getElementById(e)) && (e.textContent = "...");
    },
  );
  var a = document.getElementById("metPlantillas");
  a &&
    setTimeout(function () {
      a.textContent = 0;
    }, 500);
}
function waToggleAcc(e) {
  var a = e.querySelector(".wa-acc-arrow"),
    t = (e = e.nextElementSibling).classList.contains("open");
  (e.classList.toggle("open", !t), a.classList.toggle("open", !t));
}
function waInitPaneles() {
  (document
    .getElementById("waBtnCollapseLeft")
    .addEventListener("click", function () {
      var e = document
        .getElementById("waPanelLeft")
        .classList.toggle("collapsed");
      this.className = e
        ? "ti ti-layout-sidebar-left-expand"
        : "ti ti-layout-sidebar-left-collapse";
    }),
    document
      .getElementById("waBtnCollapseRight")
      .addEventListener("click", function () {
        var e = document
          .getElementById("waPanelRight")
          .classList.toggle("collapsed");
        this.className = e
          ? "ti ti-layout-sidebar-right-expand"
          : "ti ti-layout-sidebar-right-collapse";
      }));
}
function waCargarLista() {
  apex.server.process(
    "WA_GET_CONVERSACIONES",
    {},
    {
      dataType: "json",
      success: function (e) {
        var a,
          t,
          n,
          o,
          i = document.getElementById("waConvList");
        i &&
          ((a = window.waConvActiva),
          (i.innerHTML = ""),
          e && 0 !== e.length
            ? ((t = e)[0] &&
                e[0]._stats &&
                (waSetFiltrosCounts(
                  (n = e[0]).total,
                  n.noleidas,
                  n.bot,
                  n.asignadas,
                ),
                waUpdateDayStats(n.total, n.resueltas, n.pendientes),
                (window.waEsAdmin = "S" === n.es_admin),
                (t = e.slice(1))),
              0 === t.length
                ? (i.innerHTML =
                    '<div style="padding:24px;text-align:center;font-size:12px;color:#94a3b8">Sin conversaciones</div>')
                : ((n = t.filter(function (e) {
                    return 0 < parseInt(e.noleidos);
                  })),
                  (e = t.filter(function (e) {
                    return 0 === parseInt(e.noleidos);
                  })),
                  0 < n.length &&
                    ((i.innerHTML +=
                      '<div class="wa-conv-group-label">Sin leer (' +
                      n.length +
                      ")</div>"),
                    n.forEach(function (e) {
                      i.innerHTML += _buildConvItem(e);
                    })),
                  0 < e.length &&
                    0 < n.length &&
                    (i.innerHTML +=
                      '<div class="wa-conv-group-label">Anteriores</div>'),
                  e.forEach(function (e) {
                    i.innerHTML += _buildConvItem(e);
                  }),
                  a &&
                    (n = i.querySelector('[data-id="' + a + '"]')) &&
                    n.classList.add("selected"),
                  (o = document.getElementById("waMiniList")) &&
                    ((o.innerHTML = ""),
                    t.forEach(function (e) {
                      o.innerHTML +=
                        '<div class="wa-mini-av" style="background:' +
                        waHashColor(e.telefono) +
                        '" title="' +
                        e.telefono +
                        '">' +
                        (e.iniciales || e.telefono.slice(-2)) +
                        "</div>";
                    })),
                  waInitFiltros()))
            : ((i.innerHTML =
                '<div style="padding:24px;text-align:center;font-size:12px;color:#94a3b8">Sin conversaciones</div>'),
              waUpdateFiltrosCounts(),
              waUpdateDayStats()));
      },
      error: function () {
        var e = document.getElementById("waConvList");
        e &&
          (e.innerHTML =
            '<div style="padding:20px;text-align:center;font-size:12px;color:#ef4444">Error al cargar</div>');
      },
    },
  );
}
function _buildConvItem(e) {
  var a = waHashColor(e.telefono || ""),
    t =
      0 < parseInt(e.noleidos)
        ? '<span class="wa-unread-badge">' + e.noleidos + "</span>"
        : "",
    n = "wa-tag-noassign";
  return (
    "wa-tag-bot" === e.tag && (n = "wa-tag-bot"),
    "wa-tag-agent" === e.tag && (n = "wa-tag-agent"),
    e.asignado &&
      "SIN ASIGNAR" !== e.asignado &&
      "wa-tag-bot" !== e.tag &&
      (n = "wa-tag-agent"),
    '<div class="wa-conv-item" data-id="' +
      e.id +
      '" data-telefono="' +
      e.telefono +
      '" data-estado="' +
      e.estado +
      '" data-asignado="' +
      e.asignado +
      '" data-inicio="' +
      e.inicio +
      '" data-hora="' +
      e.hora +
      '" onclick="waSelectConv(this)"><div class="wa-av" style="background:' +
      a +
      '">' +
      (e.iniciales || e.telefono.slice(-2)) +
      '<span class="wa-dot ' +
      (e.dot || "wa-dot-gray") +
      '"></span></div><div class="wa-ci-body"><div class="wa-ci-row1"><span class="wa-ci-name">' +
      e.telefono +
      '</span><span class="wa-ci-time">' +
      e.hora +
      '</span></div><div class="wa-ci-row2"><span class="wa-ci-preview">' +
      (e.preview || "") +
      "</span>" +
      t +
      '</div><span class="wa-ci-tag ' +
      n +
      '">' +
      e.asignado +
      "</span></div></div>"
  );
}
function waInitFiltros() {
  document.querySelectorAll(".wa-filter-bar button").forEach(function (e) {
    e.onclick = function () {
      (document.querySelectorAll(".wa-filter-bar button").forEach(function (e) {
        e.classList.remove("active");
      }),
        this.classList.add("active"));
      var e = this.dataset.filter;
      (document.querySelectorAll(".wa-conv-item").forEach(function (a) {
        var t = !0;
        ("noleidas" === e && (t = null !== a.querySelector(".wa-unread-badge")),
          "bot" === e &&
            (t = !(
              !a.dataset.asignado || 0 !== a.dataset.asignado.indexOf("BOT")
            )),
          "asignadas" === e &&
            (t = !(
              !a.dataset.asignado || "SIN ASIGNAR" === a.dataset.asignado
            )),
          (a.style.display = t ? "" : "none"));
      }),
        document.querySelectorAll(".wa-conv-group-label").forEach(function (e) {
          for (
            var a = e.nextElementSibling, t = !1;
            a && a.classList.contains("wa-conv-item");
          ) {
            if ("none" !== a.style.display) {
              t = !0;
              break;
            }
            a = a.nextElementSibling;
          }
          e.style.display = t ? "" : "none";
        }));
    };
  });
  var e = document.getElementById("waSearchInput");
  e &&
    (e.oninput = function () {
      var e = this.value.toLowerCase();
      document.querySelectorAll(".wa-conv-item").forEach(function (a) {
        var t = a.dataset.telefono ? a.dataset.telefono.toLowerCase() : "";
        a.style.display = -1 < t.indexOf(e) ? "" : "none";
      });
    });
}
function waSelectConv(e) {
  (document.querySelectorAll(".wa-conv-item").forEach(function (e) {
    e.classList.remove("selected");
  }),
    e.classList.add("selected"));
  var a,
    t = e.dataset.id,
    n = e.dataset.telefono,
    o = e.dataset.estado,
    i = e.dataset.asignado,
    s = e.dataset.inicio,
    r = ((e = e.dataset.hora), waHashColor(n));
  ((e =
    ((r =
      (((a =
        (((a = document.getElementById("wchAv")).textContent = n
          .slice(-4, -2)
          .toUpperCase()),
        (a.style.background = r),
        (document.getElementById("wchName").textContent = n),
        (document.getElementById("wchSub").textContent =
          "Conv. #" + t + " · Cliente desde " + s),
        (document.getElementById("wisInicio").textContent = s),
        (document.getElementById("wisHora").textContent = e),
        (document.getElementById("wisEstado").value = o),
        (document.getElementById("spTelefono").textContent = n),
        (document.getElementById("spConvId").textContent = "Conv. #" + t),
        (document.getElementById("spFechaInicio").textContent = s),
        waUpdateChips((document.getElementById("spEstado").value = o), i, s),
        waUpdateWhatsAppLink(n),
        waUpdateMetricas(t),
        (document.getElementById("waEmptyChat").style.display = "none"),
        document.getElementById("waChatContent"))).style.display = "flex"),
      (a.style.flex = "1"),
      (a.style.flexDirection = "column"),
      (a.style.overflow = "hidden"),
      document.getElementById("waMensajesArea"))) && (r._userScrolledUp = !1),
    waCargarMensajes(t),
    waCargarUsuarios(t, i),
    waCargarNotas(t),
    waCargarAdjuntos(t),
    (window.waConvActiva = t),
    (window.waTelefonoActivo = n),
    (window.waAgenteActivo = i),
    document.getElementById("waEstadoBloque"))) &&
    (e.style.display = window.waEsAdmin ? "" : "none"),
    waCerrarTransferencia());
}
function _waHtmlEscape(e) {
  return String(e || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function _renderBubbleContent(e) {
  var url = _waHtmlEscape(e.media_url || "");
  var tipo = String(e.media_tipo || "").toLowerCase();
  var mensaje = _waHtmlEscape(e.mensaje || "");
  var nombre =
    mensaje && "[Documento]" !== mensaje ? mensaje : "Documento adjunto";

  if (!url || !tipo) return mensaje;

  if ("image" === tipo) {
    return (
      '<a href="' +
      url +
      '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' +
      url +
      '" style="max-width:220px;max-height:220px;border-radius:8px;display:block;cursor:pointer" ' +
      "onerror=\"this.parentElement.innerHTML='<span style=&quot;font-size:12px;opacity:.7&quot;>[Imagen no disponible - abrir]</span>'\">" +
      "</a>"
    );
  }

  if ("audio" === tipo) {
    return (
      '<div style="display:flex;flex-direction:column;gap:6px;min-width:180px;max-width:240px">' +
      '<audio controls preload="metadata" style="max-width:220px;width:100%;outline:none">' +
      '<source src="' +
      url +
      '">' +
      "Tu navegador no soporta audio." +
      "</audio>" +
      '<a href="' +
      url +
      '" target="_blank" rel="noopener noreferrer" style="font-size:12px;text-decoration:none;color:inherit;display:inline-flex;align-items:center;gap:5px">' +
      '<i class="ti ti-external-link"></i> Abrir audio' +
      "</a>" +
      "</div>"
    );
  }

  if ("video" === tipo) {
    return (
      '<div style="display:flex;flex-direction:column;gap:6px;max-width:240px">' +
      '<video controls preload="metadata" style="max-width:220px;width:100%;border-radius:8px;display:block">' +
      '<source src="' +
      url +
      '">' +
      "Tu navegador no soporta video." +
      "</video>" +
      '<a href="' +
      url +
      '" target="_blank" rel="noopener noreferrer" style="font-size:12px;text-decoration:none;color:inherit;display:inline-flex;align-items:center;gap:5px">' +
      '<i class="ti ti-external-link"></i> Abrir video' +
      "</a>" +
      "</div>"
    );
  }

  if ("document" === tipo) {
    return (
      '<a href="' +
      url +
      '" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:rgba(0,0,0,.06);border-radius:8px;text-decoration:none;color:inherit;font-size:12px">' +
      '<i class="ti ti-file-download" style="font-size:18px"></i>' +
      nombre +
      "</a>"
    );
  }

  return (
    '<a href="' +
    url +
    '" target="_blank" rel="noopener noreferrer" style="font-size:12px">' +
    '<i class="ti ti-paperclip"></i> ' +
    (mensaje || "Archivo") +
    "</a>"
  );
}
function waCargarMensajes(e) {
  var a = document.getElementById("waMensajesArea");
  a &&
    (a._scrollListenerAdded ||
      ((a._scrollListenerAdded = !0),
      a.addEventListener("scroll", function () {
        var e = a.scrollHeight - a.scrollTop - a.clientHeight;
        a._userScrolledUp = 120 < e;
      })),
    apex.server.process(
      "WA_GET_MENSAJES",
      { x01: e },
      {
        dataType: "json",
        success: function (e) {
          var t, n, o, i;
          ((a.innerHTML = ""),
            e &&
            0 !== e.length &&
            ((t = e)[0] &&
              e[0]._metrics &&
              ((o = e[0]),
              (n = document.getElementById("metMensajes")) &&
                (n.textContent = o.cnt_mensajes),
              (n = document.getElementById("metNotas")) &&
                (n.textContent = o.cnt_notas),
              (n = document.getElementById("metAdjuntos")) &&
                (n.textContent = o.cnt_adjuntos),
              (n = document.getElementById("notasCount")) &&
                (n.textContent = o.cnt_notas),
              (n = document.getElementById("adjCount")) &&
                (n.textContent = o.cnt_adjuntos),
              (t = e.slice(1))),
            0 !== t.length)
              ? ((i = ""),
                t.forEach(function (e) {
                  var t, n, o;
                  e &&
                    e.tipo_mensaje &&
                    "NOTA" !== e.tipo_mensaje &&
                    (e.fecha !== i &&
                      ((i = e.fecha),
                      ((t = document.createElement("div")).className =
                        "wa-day-divider"),
                      (t.innerHTML = "<span>" + e.fecha + "</span>"),
                      a.appendChild(t)),
                    (t = "ENTRADA" === e.direccion ? "entrada" : "salida"),
                    ((n = document.createElement("div")).className =
                      "wa-bw " + t),
                    (o =
                      '<div class="wa-bubble-sender ' +
                      ((o =
                        e.usuario_alta && 0 === e.usuario_alta.indexOf("BOT"))
                        ? "bot"
                        : "") +
                      '">' +
                      ("entrada" == t
                        ? "Cliente · " + (e.telefono || "")
                        : o
                          ? "Bot"
                          : e.usuario_alta || "Agente") +
                      "</div>"),
                    (o =
                      (o =
                        (o += '<div class="wa-bubble ' + t + '">') +
                        _renderBubbleContent(e)) +
                      '<div class="wa-bubble-meta"><span class="wa-bubble-time">' +
                      (e.hora || "") +
                      "</span>"),
                    "salida" == t &&
                      (o +=
                        '<i class="ti ti-checks" style="font-size:11px;opacity:.8"></i>'),
                    (o += "</div></div>"),
                    e.intencion &&
                      "salida" == t &&
                      (o +=
                        '<span class="wa-intencion">' +
                        e.intencion +
                        "</span>"),
                    (n.innerHTML = o),
                    a.appendChild(n));
                }),
                requestAnimationFrame(function () {
                  a._userScrolledUp || (a.scrollTop = a.scrollHeight);
                }))
              : (a.innerHTML =
                  '<div style="text-align:center;padding:20px;font-size:12px;color:#9ca3af">Sin mensajes</div>'));
        },
        error: function () {
          a &&
            (a.innerHTML =
              '<div style="text-align:center;padding:20px;font-size:12px;color:#ef4444">Error al cargar mensajes</div>');
        },
      },
    ));
}
function waCargarUsuarios(e, a) {
  apex.server.process(
    "WA_GET_USUARIOS",
    { x01: e },
    {
      dataType: "json",
      success: function (e) {
        var t = document.getElementById("spAgente");
        ((t.innerHTML = '<option value="">Sin asignar</option>'),
          e &&
            0 < e.length &&
            e.forEach(function (e) {
              var n = e.id === a ? " selected" : "";
              t.innerHTML +=
                '<option value="' +
                e.id +
                '"' +
                n +
                ">" +
                e.nombre +
                "</option>";
            }),
          a && "SIN ASIGNAR" !== a && (t.value = a));
      },
      error: function () {
        console.log("Error cargando usuarios");
      },
    },
  );
}
function waCargarNotas(e) {
  apex.server.process(
    "WA_GET_NOTAS",
    { x01: e },
    {
      dataType: "json",
      success: function (e) {
        var a,
          t = document.getElementById("waAccNotas");
        t &&
          (e && 0 !== e.length
            ? ((t.innerHTML = ""),
              e.forEach(function (e) {
                var a =
                  e.usuario && 0 === e.usuario.indexOf("BOT")
                    ? '<i class="ti ti-robot"></i>'
                    : '<i class="ti ti-user"></i>';
                t.innerHTML +=
                  '<div class="wa-nota-card"><div class="wa-nota-card-top"><span class="wa-nota-card-user">' +
                  a +
                  (e.usuario || "") +
                  '</span><span class="wa-nota-card-date">' +
                  (e.fecha || "") +
                  '</span></div><div class="wa-nota-card-text">' +
                  (e.mensaje || "") +
                  "</div></div>";
              }),
              (a = document.getElementById("notasCount")) &&
                (a.textContent = e.length))
            : ((t.innerHTML =
                '<div style="font-size:11px;color:#9ca3af;text-align:center;padding:8px 0">Sin notas</div>'),
              (a = document.getElementById("notasCount")) &&
                (a.textContent = "0")));
      },
      error: function () {
        console.log("Error cargando notas");
      },
    },
  );
}
function waCargarAdjuntos(e) {
  apex.server.process(
    "WA_GET_ADJUNTOS",
    { x01: e },
    {
      dataType: "json",
      success: function (adjuntos) {
        var cont = document.getElementById("waAccAdjuntos");
        if (!cont) return;

        if (!adjuntos || adjuntos.length === 0) {
          cont.innerHTML =
            '<div style="font-size:11px;color:#9ca3af;text-align:center;padding:8px 0">Sin adjuntos</div>';
          return;
        }

        cont.innerHTML = "";

        var iconos = {
          pdf: "ti-file-type-pdf",
          doc: "ti-file-type-doc",
          docx: "ti-file-type-docx",
          xls: "ti-file-type-xls",
          xlsx: "ti-file-type-xls",
          jpg: "ti-photo",
          jpeg: "ti-photo",
          png: "ti-photo",
          webp: "ti-photo",
          ogg: "ti-music",
          mp3: "ti-music",
          mp4: "ti-video",
        };

        adjuntos.forEach(function (adj) {
          var nombre = adj.nombre || "";
          var ext = nombre ? nombre.split(".").pop().toLowerCase() : "";
          var icono = iconos[ext] || "ti-file";
          var url = adj.media_url || "";
          var link = url
            ? '<a class="wa-adj-dl" href="' +
              url +
              '" target="_blank"><i class="ti ti-download"></i></a>'
            : '<span class="wa-adj-dl" style="opacity:.35"><i class="ti ti-download"></i></span>';

          cont.innerHTML +=
            '<div class="wa-adj-item">' +
            '<i class="ti ' +
            icono +
            ' wa-adj-type"></i>' +
            '<div style="flex:1;min-width:0">' +
            '<div class="wa-adj-name">' +
            nombre +
            "</div>" +
            '<div class="wa-adj-meta">' +
            (adj.fecha || "") +
            " · " +
            (adj.usuario || "") +
            "</div>" +
            "</div>" +
            link +
            "</div>";
        });
      },
      error: function () {
        console.log("Error cargando adjuntos");
      },
    },
  );
}
function waInitTabs() {
  document.querySelectorAll(".wa-msg-tab").forEach(function (e) {
    e.addEventListener("click", function () {
      (document.querySelectorAll(".wa-msg-tab").forEach(function (e) {
        e.classList.remove("active");
      }),
        this.classList.add("active"));
      var e = document.getElementById("waTextarea"),
        a = document.getElementById("waMensajesArea"),
        t = document.getElementById("waNotasArea");
      "nota" === this.dataset.tab
        ? ((a.style.display = "none"),
          (t.style.display = "flex"),
          e.classList.add("nota-mode"),
          (e.placeholder = "Escribí una nota interna..."),
          window.waConvActiva && waCargarNotasChat(window.waConvActiva))
        : ((a.style.display = "flex"),
          (t.style.display = "none"),
          e.classList.remove("nota-mode"),
          (e.placeholder = "Escribe un mensaje..."));
    });
  });
}
function waUsarRapida(e) {
  ((e = e.innerText.replace(/^\S+\s*/, "").trim()),
    (document.getElementById("waTextarea").value = e),
    document.getElementById("waTextarea").focus());
}
function waInitEnviar() {
  document.getElementById("waBtnSend").addEventListener("click", function () {
    var e,
      a = document.getElementById("waTextarea"),
      t = a.value.trim();
    t &&
      window.waConvActiva &&
      ((e =
        "nota" === document.querySelector(".wa-msg-tab.active").dataset.tab
          ? "NOTA"
          : "TEXTO"),
      (a.value = ""),
      (a = document.getElementById("waCharCount")) &&
        (a.textContent = "0/2000"),
      apex.server.process(
        "WA_SEND_MENSAJE",
        {
          x01: window.waConvActiva,
          x02: t,
          x03: e,
          x04: window.waTelefonoActivo,
        },
        {
          dataType: "json",
          success: function () {
            "NOTA" == e
              ? (waCargarNotas(window.waConvActiva),
                waCargarNotasChat(window.waConvActiva))
              : (waCargarMensajes(window.waConvActiva), waCargarLista());
          },
          error: function () {
            console.log("Error enviando mensaje");
          },
        },
      ));
  });
}
function waGuardarNota() {
  var e;
  window.waConvActiva
    ? (e = document.getElementById("waNotaTexto").value.trim())
      ? apex.server.process(
          "WA_SEND_MENSAJE",
          { x01: window.waConvActiva, x02: e, x03: "NOTA" },
          {
            dataType: "json",
            success: function () {
              ((document.getElementById("waNotaTexto").value = ""),
                waCargarNotas(window.waConvActiva),
                waCargarMensajes(window.waConvActiva));
            },
            error: function (e) {
              console.error("Error nota:", e.responseText);
            },
          },
        )
      : apex.message.alert("Escribí el texto de la nota")
    : apex.message.alert("No hay conversación activa");
}
function waPreviewFile(e) {
  var a = document.getElementById("waFileLabel"),
    t = document.getElementById("waBtnSubir");
  e.files && e.files[0]
    ? ((a.textContent = e.files[0].name), (t.style.display = "flex"))
    : ((a.textContent = "Seleccióná un archivo"), (t.style.display = "none"));
}
function waSubirAdjunto() {
  var e, a;
  window.waConvActiva &&
    (a = document.getElementById("waFileInput")).files &&
    a.files[0] &&
    ((e = a.files[0]),
    ((a = new FileReader()).onload = function (a) {
      ((a = a.target.result.split(",")[1]),
        apex.server.process(
          "WA_SAVE_ADJUNTO",
          { x01: window.waConvActiva, x02: e.name, x03: e.type, x04: a },
          {
            dataType: "json",
            success: function () {
              ((document.getElementById("waFileInput").value = ""),
                (document.getElementById("waFileLabel").textContent =
                  "Seleccióná un archivo"),
                (document.getElementById("waBtnSubir").style.display = "none"),
                waCargarAdjuntos(window.waConvActiva),
                apex.message.showPageSuccess("Archivo subido correctamente"));
            },
            error: function () {
              console.log("Error subiendo adjunto");
            },
          },
        ));
    }),
    a.readAsDataURL(e));
}
function waAsignarAgente() {
  var e;
  window.waConvActiva &&
    ((e = document.getElementById("spAgente").value),
    apex.server.process(
      "WA_UPDATE_CONV",
      { x01: window.waConvActiva, x02: e, x03: "AGENTE" },
      {
        dataType: "json",
        success: function () {
          (apex.message.showPageSuccess("Agente actualizado"), waCargarLista());
        },
      },
    ));
}
function waActualizarEstado() {
  var e, a;
  window.waConvActiva &&
    ((a =
      "CERRADA" === (e = document.getElementById("spEstado").value)
        ? { x01: window.waConvActiva }
        : { x01: window.waConvActiva, x02: e, x03: "ESTADO" }),
    apex.server.process(
      "CERRADA" === e ? "WA_FINALIZAR_CONVERSACION" : "WA_UPDATE_CONV",
      a,
      {
        dataType: "json",
        success: function (a) {
          a && !1 === a.success
            ? apex.message.alert(a.error || "No se pudo actualizar")
            : (apex.message.showPageSuccess(
                "CERRADA" === e
                  ? "Conversación finalizada. El bot volverá a responder."
                  : "Estado actualizado",
              ),
              waCargarLista(),
              window.waConvActiva && waCargarMensajes(window.waConvActiva));
        },
        error: function (e) {
          (console.error(e.responseText),
            apex.message.alert("Error actualizando la conversación"));
        },
      },
    ));
}
function waAbrirTransferencia() {
  var e, a, t, n;
  window.waConvActiva
    ? ((document.getElementById("waAccionesLista").style.display = "none"),
      (document.getElementById("waTransferPanel").style.display = "block"),
      (e = window.waAgenteActivo || "Sin asignar"),
      (t = document.getElementById("trAvActual")),
      (a = document.getElementById("trNombreActual")),
      t &&
        ((t.textContent = e.slice(0, 2).toUpperCase()),
        (t.style.background = waHashColor(e)),
        (t.style.color = "#fff")),
      a && (a.textContent = e),
      (t = document.getElementById("trNota")) && (t.value = ""),
      ((n = document.getElementById("trAgentesGrid")).innerHTML =
        '<div style="text-align:center;padding:12px;font-size:11px;color:#94a3b8;grid-column:span 2">Cargando agentes...</div>'),
      (window.waAgenteTransferir = null),
      apex.server.process(
        "WA_GET_AGENTES_CARGA",
        {},
        {
          dataType: "json",
          success: function (e) {
            ((n.innerHTML = ""),
              e && 0 !== e.length
                ? e.forEach(function (e) {
                    var a = Math.round((e.conv_activas / 5) * 100),
                      t = 80 <= a ? "#EF9F27" : "#185FA5",
                      o = document.createElement("div");
                    ((o.className = "wa-tr-card"),
                      (o.dataset.id = e.id),
                      (o.dataset.nombre = e.nombre),
                      (o.style.cssText =
                        "padding:8px;border-radius:8px;border:0.5px solid #e2e8f0;cursor:pointer;background:transparent;transition:border-color .15s"),
                      (o.innerHTML =
                        '<div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;margin-bottom:4px;background:' +
                        waHashColor(e.id) +
                        ';color:#fff">' +
                        e.id.slice(0, 2).toUpperCase() +
                        '</div><div style="font-size:10px;font-weight:500;color:var(--color-text,#1e293b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
                        e.nombre +
                        '</div><div style="font-size:9px;color:#94a3b8;margin-bottom:4px">' +
                        e.conv_activas +
                        ' / 5</div><div style="height:3px;border-radius:2px;background:#e2e8f0;overflow:hidden"><div style="height:100%;border-radius:2px;width:' +
                        a +
                        "%;background:" +
                        t +
                        '"></div></div>'),
                      (o.onclick = function () {
                        (document
                          .querySelectorAll(".wa-tr-card")
                          .forEach(function (e) {
                            ((e.style.border = "0.5px solid #e2e8f0"),
                              (e.style.background = "transparent"));
                          }),
                          (this.style.border = "1.5px solid #185FA5"),
                          (this.style.background = "#EFF6FF"),
                          (window.waAgenteTransferir = this.dataset.id),
                          (window.waAgenteTransferirNom = this.dataset.nombre));
                      }),
                      n.appendChild(o));
                  })
                : (n.innerHTML =
                    '<div style="text-align:center;padding:12px;font-size:11px;color:#94a3b8;grid-column:span 2">Sin agentes disponibles</div>'));
          },
          error: function () {
            n.innerHTML =
              '<div style="text-align:center;padding:12px;font-size:11px;color:#ef4444;grid-column:span 2">Error cargando agentes</div>';
          },
        },
      ))
    : apex.message.alert("Seleccióná una conversación primero");
}
function waCerrarTransferencia() {
  var e = document.getElementById("waAccionesLista"),
    a = document.getElementById("waTransferPanel");
  (e && (e.style.display = ""),
    a && (a.style.display = "none"),
    (window.waAgenteTransferir = null),
    (window.waAgenteTransferirNom = null));
}
function waConfirmarTransferencia() {
  var e;
  window.waConvActiva
    ? window.waAgenteTransferir
      ? ((e = document.getElementById("trNota").value.trim()),
        apex.server.process(
          "WA_TRANSFERIR_CONV",
          { x01: window.waConvActiva, x02: window.waAgenteTransferir, x03: e },
          {
            dataType: "json",
            success: function (e) {
              e && !1 === e.success
                ? apex.message.alert(e.error || "No se pudo transferir")
                : (apex.message.showPageSuccess(
                    "Conversación transferida a " +
                      window.waAgenteTransferirNom,
                  ),
                  (window.waAgenteActivo = window.waAgenteTransferir),
                  waCerrarTransferencia(),
                  waCargarLista(),
                  waCargarMensajes(window.waConvActiva),
                  waCargarNotas(window.waConvActiva));
            },
            error: function (e) {
              (console.error(e.responseText),
                apex.message.alert("Error al transferir la conversación"));
            },
          },
        ))
      : apex.message.alert("Seleccióná un agente destino")
    : apex.message.alert("No hay conversación activa");
}
function waTransferirConv() {
  waAbrirTransferencia();
}
function waMarcarPendiente() {
  window.waConvActiva
    ? ((document.getElementById("spEstado").value = "PENDIENTE"),
      waActualizarEstado())
    : apex.message.alert("Seleccióná una conversación primero");
}
function waCerrarConv() {
  window.waConvActiva
    ? apex.message.confirm(
        "¿Cerrar esta conversación? El bot volverá a responder.",
        function (e) {
          e &&
            ((document.getElementById("spEstado").value = "CERRADA"),
            waActualizarEstado());
        },
      )
    : apex.message.alert("Seleccióná una conversación primero");
}
function waIniciarRefresh() {
  (waRefreshInterval && clearInterval(waRefreshInterval),
    (waRefreshInterval = setInterval(function () {
      var e;
      (waCargarLista(),
        window.waConvActiva &&
          (waCargarMensajes(window.waConvActiva),
          (e = document.querySelector(".wa-msg-tab.active"))) &&
          "nota" === e.dataset.tab &&
          waCargarNotasChat(window.waConvActiva));
    }, 3e3)));
}
function waDetenerRefresh() {
  waRefreshInterval &&
    (clearInterval(waRefreshInterval), (waRefreshInterval = null));
}
function waCargarNotasChat(e) {
  var a = document.getElementById("waNotasArea");
  a &&
    (a._scrollListenerAdded ||
      ((a._scrollListenerAdded = !0),
      a.addEventListener("scroll", function () {
        var e = a.scrollHeight - a.scrollTop - a.clientHeight;
        a._userScrolledUp = 120 < e;
      })),
    (a.innerHTML =
      '<div style="text-align:center;padding:20px;font-size:12px;color:#9ca3af">Cargando notas...</div>'),
    apex.server.process(
      "WA_GET_NOTAS",
      { x01: e },
      {
        dataType: "json",
        success: function (e) {
          var t;
          ((a.innerHTML = ""),
            e && 0 !== e.length
              ? ((t = ""),
                e.forEach(function (e) {
                  var n, o;
                  (((o =
                    ((o = e.fecha ? e.fecha.substring(0, 10) : "") !== t &&
                      ((t = o),
                      ((n = document.createElement("div")).className =
                        "wa-day-divider"),
                      (n.innerHTML = "<span>" + o + "</span>"),
                      a.appendChild(n)),
                    document.createElement("div"))).className = "wa-bw salida"),
                    (o.innerHTML =
                      '<div class="wa-bubble-sender" style="text-align:right;color:#92400e">' +
                      (e.usuario || "") +
                      '</div><div class="wa-bubble nota"><i class="ti ti-lock wa-nota-lock-icon"></i>' +
                      (e.mensaje || "") +
                      '<div class="wa-bubble-meta"><span class="wa-bubble-time">' +
                      (e.fecha ? e.fecha.substring(11) : "") +
                      "</span></div></div>"),
                    a.appendChild(o));
                }),
                requestAnimationFrame(function () {
                  a._userScrolledUp || (a.scrollTop = a.scrollHeight);
                }))
              : (a.innerHTML =
                  '<div style="text-align:center;padding:20px;font-size:12px;color:#9ca3af">Sin notas internas</div>'));
        },
        error: function () {
          a.innerHTML =
            '<div style="text-align:center;padding:20px;font-size:12px;color:#ef4444">Error al cargar notas</div>';
        },
      },
    ));
}
apex.jQuery(document).ready(function () {
  (waInitPaneles(),
    waInitTabs(),
    waInitEnviar(),
    waCharCounter(),
    waCargarLista(),
    waIniciarRefresh());
});

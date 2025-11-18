#!/bin/bash

# Quick domain availability checker
# Uses whois to check if domains are registered

echo "🔍 Checking domain availability..."
echo ""

check_domain() {
    domain=$1
    echo -n "Checking $domain ... "

    # Try whois lookup
    if command -v whois &> /dev/null; then
        result=$(whois "$domain" 2>&1 | grep -i "no match\|not found\|no entries\|available" | head -1)
        if [ -n "$result" ]; then
            echo "✅ LIKELY AVAILABLE"
            return 0
        else
            registered=$(whois "$domain" 2>&1 | grep -i "registrar:\|creation date:\|registered" | head -1)
            if [ -n "$registered" ]; then
                echo "❌ TAKEN"
                return 1
            else
                echo "⚠️  UNKNOWN (check manually)"
                return 2
            fi
        fi
    else
        # Fallback: use nslookup to check if domain resolves
        if nslookup "$domain" &> /dev/null; then
            echo "❌ TAKEN (DNS resolves)"
            return 1
        else
            echo "✅ POSSIBLY AVAILABLE (no DNS)"
            return 0
        fi
    fi
}

# Priority domains to check
domains=(
    "distillculture.com"
    "chartedwisdom.com"
    "synthesiscaptain.com"
    "wisdomcharts.com"
    "theknowledgehelm.com"
    "globalgleanings.com"
    "meridianlogbook.com"
    "captainssextant.com"
    "depthsofwisdom.com"
    "worldsynthesis.blog"
    "anchoredknowledge.com"
    "navigatorscompendium.com"
    "trueheadingblog.com"
    "culturalchronometer.com"
    "helmsmanchronicle.com"
    "theblackhelmsman.com"
    "bearingsandwisdom.com"
    "culturedsynthesis.com"
    "culturalcartography.com"
    "omnicultural.com"
)

available=()
taken=()
unknown=()

for domain in "${domains[@]}"; do
    check_domain "$domain"
    case $? in
        0) available+=("$domain") ;;
        1) taken+=("$domain") ;;
        2) unknown+=("$domain") ;;
    esac
    sleep 0.5  # Be nice to whois servers
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#available[@]} -gt 0 ]; then
    echo "✅ LIKELY AVAILABLE (${#available[@]}):"
    for d in "${available[@]}"; do
        echo "   • $d"
    done
    echo ""
fi

if [ ${#taken[@]} -gt 0 ]; then
    echo "❌ TAKEN (${#taken[@]}):"
    for d in "${taken[@]}"; do
        echo "   • $d"
    done
    echo ""
fi

if [ ${#unknown[@]} -gt 0 ]; then
    echo "⚠️  NEED MANUAL CHECK (${#unknown[@]}):"
    for d in "${unknown[@]}"; do
        echo "   • $d"
    done
    echo ""
fi

echo "💡 To verify, check on Cloudflare: https://domains.cloudflare.com/"
